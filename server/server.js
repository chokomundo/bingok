import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';

const { Client, LocalAuth, MessageMedia } = pkg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '100mb' })); // Increase JSON limit to handle large ticket arrays up to 20,000 tickets

// --- DATABASE PATHS (Binds directly with the central website files) ---
const ticketsFilePath = path.join(__dirname, '../public/bingo_tickets.json');
const downloadsFilePath = path.join(__dirname, '../public/bingo_downloads_log.json');
const authorizedFilePath = path.join(__dirname, '../public/bingo_authorized_ids.json');

let ticketsData = [];

// Try to load pre-existing tickets from central database on startup
try {
  if (fs.existsSync(ticketsFilePath)) {
    const rawData = fs.readFileSync(ticketsFilePath, 'utf8');
    ticketsData = JSON.parse(rawData);
    console.log(`[Database] Se cargaron ${ticketsData.length} cartones de la base de datos central en public/.`);
  }
} catch (error) {
  console.warn('[Database] No se pudieron cargar cartones de la base de datos central:', error.message);
}

// Convert Bolillo logo to base64 for WhatsApp card rendering
let bolilloLogoBase64 = '';
const bolilloLogoPath = path.join(__dirname, '../src/assets/bolillo_logo.jpg');
try {
  if (fs.existsSync(bolilloLogoPath)) {
    const fileBuffer = fs.readFileSync(bolilloLogoPath);
    bolilloLogoBase64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
    console.log('[Assets] Logo de Bolillo cargado exitosamente para el renderizado del WhatsApp bot.');
  }
} catch (error) {
  console.warn('[Assets Error] Error al leer el logo de Bolillo:', error.message);
}

// --- EXTRACT & PADDING TICKET NUMBER ---
function extractTicketNumber(text) {
  // Matches a standalone number of 1 to 5 digits, e.g. "42", "00042", "carton 12"
  const match = text.match(/\b\d{1,5}\b/);
  if (match) {
    const num = parseInt(match[0], 10);
    return String(num).padStart(5, '0');
  }
  return null;
}

// --- EXTRACT MULTIPLE TICKET NUMBERS ---
function extractTicketNumbers(text) {
  // Matches all standalone numbers of 1 to 5 digits, e.g. "34,59,1443"
  const matches = text.match(/\b\d{1,5}\b/g);
  if (matches && matches.length > 0) {
    const unique = [...new Set(matches.map(m => {
      const num = parseInt(m, 10);
      return String(num).padStart(5, '0');
    }))];
    return unique;
  }
  return [];
}

// --- MATCH SELLER ID (Allows multiple IDs separated by newlines, commas, spaces, or semicolons) ---
function isMatchSellerId(seller, userPhoneNumber) {
  const sId = (typeof seller === 'object' && seller !== null) ? seller.id : seller;
  if (!sId) return false;
  const ids = String(sId).split(/[\n,\s;]+/).map(x => x.trim()).filter(Boolean);
  return ids.includes(String(userPhoneNumber).trim());
}

// --- CHECK IF A SELLER ROW BELONGS TO A GIVEN SELLER ---
// Matches by: registered name, userPhoneNumber, OR any of the seller's stored IDs
function isRowMatchingSeller(row, registeredName, userPhoneNumber, sellerObj) {
  if (!row.name) return false;
  const rowNameClean = row.name.toLowerCase().trim();

  // 1. Match by registered name
  if (registeredName && rowNameClean === registeredName.toLowerCase().trim()) return true;

  // 2. Match by the phone number of the message sender
  if (rowNameClean === String(userPhoneNumber).trim()) return true;

  // 3. Match by any of the stored IDs (supports multi-line IDs)
  if (sellerObj) {
    const sId = (typeof sellerObj === 'object' && sellerObj !== null) ? sellerObj.id : sellerObj;
    if (sId) {
      const ids = String(sId).split(/[\n,\s;]+/).map(x => x.trim()).filter(Boolean);
      if (ids.some(id => rowNameClean === id.toLowerCase())) return true;
    }
  }

  return false;
}

// --- DYNAMIC CLEAN TICKET HTML RENDERER ---
function generateTicketHtml(ticket) {
  const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
  const formattedTicketNum = String(ticket.ticket_number || 1).padStart(6, '0');
  const ticketValue = ticket.price || '20 BS';

  let gridCellsHtml = '';
  ticket.matrix.forEach((row) => {
    row.forEach((cell) => {
      const isFree = cell === 0;

      if (isFree) {
        gridCellsHtml += `
          <div class="cell cell-free">
            <div class="free-content">
              <div class="free-badge">B</div>
            </div>
          </div>
        `;
      } else {
        gridCellsHtml += `
          <div class="cell">
            <span class="cell-number">${cell}</span>
          </div>
        `;
      }
    });
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Carton ${ticket.ticket_number}</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Cinzel:wght@600;700;800;900&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 16px;
          background-color: #FAF6EF;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Cinzel', Georgia, serif;
        }

        #card-wrapper {
          padding: 12px;
          background-color: #FAF6EF;
          display: inline-block;
          border-radius: 20px;
        }

        #card-container {
          width: 420px;
          background: #FAF6EF;
          border: 5px solid #C5A052;
          border-radius: 16px;
          padding: 14px 14px 16px 14px;
          box-shadow: 0 15px 40px rgba(84, 40, 19, 0.25), inset 0 0 20px rgba(197, 160, 82, 0.15);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }

        /* Inner thin border */
        .inner-border {
          position: absolute;
          top: 6px;
          bottom: 6px;
          left: 6px;
          right: 6px;
          border: 1px solid #C5A052;
          border-radius: 12px;
          pointer-events: none;
          z-index: 10;
        }

        /* Corner Flourishes */
        .flourish {
          position: absolute;
          color: #C5A052;
          font-size: 14px;
          line-height: 1;
          z-index: 11;
        }
        .fl-tl { top: 8px; left: 8px; }
        .fl-tr { top: 8px; right: 8px; transform: rotate(90deg); }
        .fl-bl { bottom: 8px; left: 8px; transform: rotate(-90deg); }
        .fl-br { bottom: 8px; right: 8px; transform: rotate(180deg); }

        /* Header Panel */
        .header-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          padding: 0 4px;
          position: relative;
          z-index: 2;
        }

        .header-logo {
          width: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header-logo img {
          width: 100%;
          height: auto;
          object-fit: contain;
          mix-blend-mode: multiply;
          border-radius: 50%;
        }

        .header-middle {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .ribbon {
          background-color: #8B1A1A;
          color: #FFFFFF;
          padding: 3px 16px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          clip-path: polygon(0 0, 100% 0, 92% 100%, 8% 100%);
          font-family: 'Cinzel', Georgia, serif;
        }

        .ticket-number-display {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 34px;
          font-weight: 900;
          color: #111111;
          line-height: 1;
          margin-top: 3px;
          letter-spacing: -0.02em;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 80px;
        }

        .valor-title {
          font-size: 11px;
          font-weight: 900;
          color: #8B1A1A;
          letter-spacing: 0.1em;
        }

        .valor-divider {
          width: 100%;
          height: 1px;
          background-color: #C5A052;
          margin: 2px 0;
        }

        .valor-amount {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 900;
          color: #111111;
          line-height: 1;
        }

        /* Grid Outer Container */
        .grid-container {
          border: 3px solid #C5A052;
          border-radius: 8px;
          padding: 2px;
          background-color: rgba(197, 160, 82, 0.2);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          z-index: 2;
        }

        /* Letter Headers (B I N G O) */
        .letters-panel {
          background-color: #8B1A1A;
          border-bottom: 2px solid #C5A052;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
        }

        .letter {
          font-family: 'Cinzel', Georgia, serif;
          color: #E2C070;
          font-size: 24px;
          font-weight: 900;
          text-align: center;
          padding: 5px 0;
          letter-spacing: 0.05em;
          border-right: 1px solid rgba(197, 160, 82, 0.4);
        }
        .letter:last-child {
          border-right: none;
        }

        /* Grid Cells */
        .grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1px;
          background-color: rgba(197, 160, 82, 0.4);
        }

        .cell {
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFDF9;
          position: relative;
          box-sizing: border-box;
        }

        .cell-number {
          font-family: 'Playfair Display', Georgia, serif;
          color: #111111;
          font-size: 24px;
          font-weight: 900;
          line-height: 1;
        }

        .cell-free {
          background: #F5EEE3;
          border: 2px solid #C5A052;
        }

        .free-content {
          width: 100%;
          height: 100%;
          padding: 3px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .free-badge {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #C5A052;
          background-color: #8B1A1A;
          color: #E2C070;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cinzel', Georgia, serif;
          font-weight: 900;
          font-size: 16px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        /* Footer Ribbon */
        .footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          margin-bottom: 4px;
          z-index: 2;
        }

        .footer-symbol {
          color: #C5A052;
          font-size: 12px;
        }

        .footer-ribbon {
          background-color: #8B1A1A;
          color: #FFFFFF;
          padding: 4px 24px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          clip-path: polygon(6% 0, 94% 0, 100% 100%, 0 100%);
          font-family: 'Cinzel', Georgia, serif;
        }
      </style>
    </head>
    <body>
      <div id="card-wrapper">
        <div id="card-container">
          <!-- Inner Border -->
          <div class="inner-border"></div>

          <!-- Corner Flourishes -->
          <div class="flourish fl-tl">❧</div>
          <div class="flourish fl-tr">❧</div>
          <div class="flourish fl-bl">❧</div>
          <div class="flourish fl-br">❧</div>

          <!-- Top Header Panel -->
          <div class="header-panel">
            <div class="header-logo">
              ${bolilloLogoBase64 ? `<img src="${bolilloLogoBase64}" alt="Logo">` : '<div style="font-weight:900;color:#8B1A1A;">BOLILLO</div>'}
            </div>
            <div class="header-middle">
              <div class="ribbon">CARTÓN #</div>
              <div class="ticket-number-display">${formattedTicketNum}</div>
            </div>
            <div class="header-right">
              <span class="valor-title">VALOR:</span>
              <div class="valor-divider"></div>
              <span class="valor-amount">${ticketValue}</span>
              <div class="valor-divider"></div>
            </div>
          </div>

          <!-- 5x5 Grid Box -->
          <div class="grid-container">
            <div class="letters-panel">
              ${BINGO_LETTERS.map(l => `<div class="letter">${l}</div>`).join('')}
            </div>
            <div class="grid">
              ${gridCellsHtml}
            </div>
          </div>

          <!-- Footer Ribbon -->
          <div class="footer">
            <span class="footer-symbol">❖</span>
            <div class="footer-ribbon">¡BUENA SUERTE!</div>
            <span class="footer-symbol">❖</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// --- DYNAMIC TICKET IMAGE RENDERER (PUPPETEER SCREENSHOT ENGINE) ---
async function renderTicketToImage(ticket) {
  if (!client || !client.pupBrowser) {
    throw new Error('El navegador de Puppeteer del bot de WhatsApp no está inicializado.');
  }

  // Create a blank tab
  const page = await client.pupBrowser.newPage();

  // Set the viewport with generous margins so no borders or footers are clipped
  await page.setViewport({
    width: 480,
    height: 600,
    deviceScaleFactor: 2 // High-definition Retina scale (high detail)
  });

  const html = generateTicketHtml(ticket);

  // Load HTML directly into Puppeteer
  await page.setContent(html, { waitUntil: 'load' });

  // Locate the #card-wrapper element
  const cardElement = await page.$('#card-wrapper');
  if (!cardElement) {
    await page.close();
    throw new Error('No se pudo encontrar el contenedor del cartón (#card-wrapper) en el HTML.');
  }

  // Screenshot buffer
  const buffer = await cardElement.screenshot({ type: 'png' });
  
  // Always close the tab to avoid memory leaks
  await page.close();

  return buffer;
}

// --- REST API ENDPOINTS ---

const sellerRowsFilePath = path.join(__dirname, '../public/bingo_seller_rows.json');

app.post('/api/tickets', (req, res) => {
  const { tickets } = req.body;
  if (!Array.isArray(tickets)) {
    return res.status(400).json({ error: 'La base de datos de cartones debe ser una matriz JSON.' });
  }

  ticketsData = tickets;
  
  // Persist to central public/bingo_tickets.json file so the website can read it!
  try {
    fs.writeFileSync(ticketsFilePath, JSON.stringify(ticketsData, null, 2), 'utf8');
    console.log(`[Database] Se guardaron y sincronizaron exitosamente ${ticketsData.length} cartones en ${ticketsFilePath}`);
  } catch (error) {
    console.error('[Database Error] No se pudo escribir en el archivo central:', error.message);
  }

  res.json({ success: true, count: ticketsData.length, message: 'Base de datos de cartones sincronizada en el servidor central' });
});

// POST: Save/Sync Distributed Seller Rows
app.post('/api/save-seller-rows', (req, res) => {
  const rows = req.body;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ error: 'Las filas de vendedores deben ser una matriz JSON.' });
  }
  try {
    fs.writeFileSync(sellerRowsFilePath, JSON.stringify(rows, null, 2), 'utf8');
    console.log(`[Database] Se guardaron exitosamente las filas en ${sellerRowsFilePath}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[Database Error] No se pudo escribir las filas en el archivo central:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const superAdminsFilePath = path.join(__dirname, '../public/bingo_super_admins.json');

// GET: Retrieve registered super admins
app.get('/api/super-admins', (req, res) => {
  try {
    if (fs.existsSync(superAdminsFilePath)) {
      const data = fs.readFileSync(superAdminsFilePath, 'utf8');
      return res.json(JSON.parse(data));
    }
    res.json([]);
  } catch (error) {
    res.json([]);
  }
});

// POST: Save/update registered super admins
app.post('/api/super-admins', (req, res) => {
  const list = req.body;
  if (!Array.isArray(list)) {
    return res.status(400).json({ error: 'Debe ser una matriz JSON' });
  }
  try {
    fs.writeFileSync(superAdminsFilePath, JSON.stringify(list, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Check API and bot status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    botConnected: botReady,
    ticketsCount: ticketsData.length
  });
});

// POST: WhatsApp Webhook Receiver for Twilio / Evolution API
app.post('/api/whatsapp/webhook', async (req, res) => {
  const body = req.body;
  const text = (body.Body || body.message?.text || body.text || '').trim();
  
  const ticketNumber = extractTicketNumber(text);
  
  if (ticketNumber) {
    // Look up the ticket
    const ticket = ticketsData.find(t => t.ticket_number === ticketNumber);
    if (!ticket) {
      return res.json({ reply: `❌ El cartón #${ticketNumber} no se encuentra en la base de datos.`, success: false });
    }

    try {
      const buffer = await renderTicketToImage(ticket);
      return res.json({
        reply: `🔮 Cartón #${ticketNumber} cargado correctamente.`,
        imageB64: buffer.toString('base64'),
        success: true
      });
    } catch (err) {
      return res.status(500).json({ error: 'Error al generar la imagen', details: err.message });
    }
  }

  res.json({ success: false, message: 'Mensaje ignorado (no contiene un número de cartón válido).' });
});

// --- INITIALIZE WHATSAPP WEB BOT CLIENT ---
let botReady = false;

console.log('[BOT] Inicializando cliente de WhatsApp Web...');
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './sessions'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

// Show terminal QR
client.on('qr', (qr) => {
  console.log('\n====================================================================');
  console.log('[BOT] ¡CÓDIGO QR GENERADO! Escanéalo con tu aplicación de WhatsApp:');
  console.log('      (Configuración > Dispositivos Vinculados > Vincular un dispositivo)');
  console.log('====================================================================\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('\n=========================================');
  console.log('[BOT] ¡CONEXIÓN EXITOSA!');
  console.log('[BOT] El bot de WhatsApp está listo para entregar cartones.');
  console.log('=========================================\n');
  botReady = true;
});

// Message Listener
client.on('message', async (msg) => {
  try {
    const text = msg.body.trim();
    const lowerText = text.toLowerCase();
    const userPhoneNumber = msg.from.split('@')[0]; // e.g. "59178240880"

    // 0. Super Admin Command Router
    let superAdmins = [];
    try {
      if (fs.existsSync(superAdminsFilePath)) {
        superAdmins = JSON.parse(fs.readFileSync(superAdminsFilePath, 'utf8'));
      }
    } catch (err) {}

    const isSuperAdmin = superAdmins.includes(userPhoneNumber);

    if (isSuperAdmin) {
      // Admin Help / Menu
      if (['admin', 'menu', 'ayuda admin', 'help admin'].includes(lowerText)) {
        await msg.reply(
          `🎱 *MENÚ SÚPER ADMINISTRADOR BINGO* 🎱\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `Hola Admin. Tienes acceso a los siguientes comandos automáticos:\n\n` +
          `🆓 Escribe *libres* para ver las últimas 5 filas libres para registrar.\n` +
          `➕ Escribe *nueva fila* para crear una nueva fila vacía con 50 cartones.\n` +
          `👤 Escribe *vendedor [nombre] [teléfono]* para registrar un nuevo vendedor.\n` +
          `   _(Ejemplo: vendedor Micaela Espinoza 59178240880)_\n` +
          `🔗 Escribe *asignar [número_fila] [teléfono_vendedor]* para asignarle una fila libre.\n` +
          `   _(Ejemplo: asignar 3 59178240880)_\n` +
          `❌ Escribe *eliminar [teléfono_vendedor]* para eliminar un vendedor y liberar sus filas.\n` +
          `   _(Ejemplo: eliminar 59178240880)_\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🍀 _¡Control central de ventas activo!_`
        );
        return;
      }

      // Show last 5 free rows
      if (lowerText === 'libres' || lowerText === 'filas libres') {
        let sellerRows = [];
        try {
          if (fs.existsSync(sellerRowsFilePath)) {
            sellerRows = JSON.parse(fs.readFileSync(sellerRowsFilePath, 'utf-8'));
          }
        } catch (err) {}

        const freeRows = sellerRows.filter(row => !row.name || row.name.trim() === "");
        if (freeRows.length === 0) {
          await msg.reply(`⚠️ *No quedan filas libres de cartones en el sistema.* Crea una nueva con el comando *nueva fila*.`);
          return;
        }

        const last5 = freeRows.slice(-5);
        let response = `🆓 *ÚLTIMAS ${last5.length} FILAS LIBRES PARA REGISTRAR:* \n━━━━━━━━━━━━━━━━━━\n`;
        last5.forEach(row => {
          response += `👉 Fila *#${row.id}* (${row.numbers.length} cartones libres)\n`;
        });
        response += `━━━━━━━━━━━━━━━━━━\nAsigna una fila con el comando:\n*asignar [número_fila] [teléfono_vendedor]*`;
        await msg.reply(response);
        return;
      }

      // Create new free row
      if (lowerText === 'nueva fila' || lowerText === 'crear fila') {
        if (ticketsData.length === 0 && fs.existsSync(ticketsFilePath)) {
          try {
            ticketsData = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf8'));
          } catch (e) {}
        }
        if (ticketsData.length === 0) {
          await msg.reply(`❌ *No hay una base de datos de cartones cargada en el servidor.* Sube el archivo JSON desde la web primero.`);
          return;
        }

        let sellerRows = [];
        try {
          if (fs.existsSync(sellerRowsFilePath)) {
            sellerRows = JSON.parse(fs.readFileSync(sellerRowsFilePath, 'utf-8'));
          }
        } catch (err) {}

        const assignedNumbers = new Set();
        sellerRows.forEach(row => {
          if (row.numbers && Array.isArray(row.numbers)) {
            row.numbers.forEach(num => assignedNumbers.add(String(num)));
          }
        });

        const availableTickets = ticketsData.filter(t => !assignedNumbers.has(String(t.ticket_number)));
        if (availableTickets.length < 50) {
          await msg.reply(`❌ *No hay suficientes cartones libres.* Quedan solo ${availableTickets.length} libres, se requieren 50.`);
          return;
        }

        const shuffled = [...availableTickets].sort(() => 0.5 - Math.random());
        const rowNumbers = shuffled.slice(0, 50).map(t => t.ticket_number);

        const newRowId = sellerRows.length > 0 ? Math.max(...sellerRows.map(r => r.id)) + 1 : 1;
        const newRow = {
          id: newRowId,
          name: '',
          numbers: rowNumbers
        };

        sellerRows.push(newRow);
        try {
          fs.writeFileSync(sellerRowsFilePath, JSON.stringify(sellerRows, null, 2), 'utf-8');
          await msg.reply(`✅ *¡Fila #${newRowId} creada con éxito!* \nContiene 50 cartones libres listos para vender.\nUsa *libres* para ver la lista.`);
        } catch (err) {
          await msg.reply(`❌ *Error al guardar la nueva fila en el servidor:* ${err.message}`);
        }
        return;
      }

      // Add a new seller
      if (lowerText.startsWith('vendedor ')) {
        const match = msg.body.match(/^vendedor\s+(.+?)\s+(\d+)$/i);
        if (!match) {
          await msg.reply(`⚠️ *Formato incorrecto.* Usa:\n*vendedor [nombre] [teléfono]*\n_(Ej: vendedor Micaela Espinoza 59178240880)_`);
          return;
        }

        const name = match[1].trim();
        const phone = match[2].trim();

        let authorized = [];
        try {
          if (fs.existsSync(authorizedFilePath)) {
            authorized = JSON.parse(fs.readFileSync(authorizedFilePath, 'utf-8'));
          }
        } catch (err) {}

        const exists = authorized.some(seller => {
          const sId = typeof seller === 'object' && seller !== null ? seller.id : seller;
          return String(sId).trim() === phone;
        });

        if (exists) {
          await msg.reply(`❌ *El vendedor con el teléfono ${phone} ya está registrado.*`);
          return;
        }

        authorized.push({
          id: phone,
          name: name,
          cellphone: phone,
          ci: ""
        });

        try {
          fs.writeFileSync(authorizedFilePath, JSON.stringify(authorized, null, 2), 'utf-8');
          await msg.reply(`✅ *Vendedor registrado con éxito:*\n👤 Nombre: *${name}*\n📱 Teléfono: *${phone}*\n\nAhora puedes asignarle una fila libre.`);
        } catch (err) {
          await msg.reply(`❌ *Error al guardar el vendedor:* ${err.message}`);
        }
        return;
      }

      // Assign row to seller
      if (lowerText.startsWith('asignar ')) {
        const match = lowerText.match(/^asignar\s+(\d+)\s+(\d+)$/i);
        if (!match) {
          await msg.reply(`⚠️ *Formato incorrecto.* Usa:\n*asignar [número_fila] [teléfono_vendedor]*\n_(Ej: asignar 3 59178240880)_`);
          return;
        }

        const rowId = parseInt(match[1], 10);
        const phone = match[2].trim();

        let authorized = [];
        try {
          if (fs.existsSync(authorizedFilePath)) {
            authorized = JSON.parse(fs.readFileSync(authorizedFilePath, 'utf-8'));
          }
        } catch (err) {}

        const seller = authorized.find(s => {
          const sId = typeof s === 'object' && s !== null ? s.id : s;
          return String(sId).trim() === phone;
        });

        if (!seller) {
          await msg.reply(`❌ *El vendedor con teléfono ${phone} no está registrado.* Primero regístralo con:\n*vendedor [nombre] ${phone}*`);
          return;
        }

        let sellerRows = [];
        try {
          if (fs.existsSync(sellerRowsFilePath)) {
            sellerRows = JSON.parse(fs.readFileSync(sellerRowsFilePath, 'utf-8'));
          }
        } catch (err) {}

        const row = sellerRows.find(r => r.id === rowId);
        if (!row) {
          await msg.reply(`❌ *La fila #${rowId} no existe.*`);
          return;
        }

        if (row.name && row.name.trim() !== "") {
          await msg.reply(`❌ *La fila #${rowId} ya está asignada a: ${row.name}.*`);
          return;
        }

        row.name = seller.name;

        try {
          fs.writeFileSync(sellerRowsFilePath, JSON.stringify(sellerRows, null, 2), 'utf-8');
          await msg.reply(`✅ *¡Fila #${rowId} asignada con éxito al vendedor ${seller.name} (${phone})!*`);
        } catch (err) {
          await msg.reply(`❌ *Error al guardar la asignación:* ${err.message}`);
        }
        return;
      }

      // Delete seller and free their rows
      if (lowerText.startsWith('eliminar ')) {
        const phone = lowerText.replace('eliminar', '').trim();
        if (!phone || isNaN(phone)) {
          await msg.reply(`⚠️ *Formato incorrecto.* Usa:\n*eliminar [teléfono_vendedor]*\n_(Ej: eliminar 59178240880)_`);
          return;
        }

        let authorized = [];
        try {
          if (fs.existsSync(authorizedFilePath)) {
            authorized = JSON.parse(fs.readFileSync(authorizedFilePath, 'utf-8'));
          }
        } catch (err) {}

        const sellerIndex = authorized.findIndex(s => {
          const sId = typeof s === 'object' && s !== null ? s.id : s;
          return String(sId).trim() === phone;
        });

        if (sellerIndex === -1) {
          await msg.reply(`❌ *No se encontró ningún vendedor registrado con el teléfono ${phone}.*`);
          return;
        }

        const seller = authorized[sellerIndex];
        authorized.splice(sellerIndex, 1);

        let sellerRows = [];
        try {
          if (fs.existsSync(sellerRowsFilePath)) {
            sellerRows = JSON.parse(fs.readFileSync(sellerRowsFilePath, 'utf-8'));
          }
        } catch (err) {}

        let releasedCount = 0;
        sellerRows.forEach(row => {
          if (row.name && (row.name.toLowerCase().trim() === seller.name.toLowerCase().trim() || row.name.trim() === phone)) {
            row.name = "";
            releasedCount++;
          }
        });

        try {
          fs.writeFileSync(authorizedFilePath, JSON.stringify(authorized, null, 2), 'utf-8');
          fs.writeFileSync(sellerRowsFilePath, JSON.stringify(sellerRows, null, 2), 'utf-8');
          await msg.reply(`✅ *Vendedor ${seller.name} eliminado con éxito.* Se liberaron ${releasedCount} fila(s) de cartones que tenía asignada(s).`);
        } catch (err) {
          await msg.reply(`❌ *Error al guardar los cambios:* ${err.message}`);
        }
        return;
      }
    }

    // 1. Check if user is asking for their ID code
    if (lowerText === 'id') {
      console.log(`[BOT] Solicitud de ID del número ${userPhoneNumber}`);
      await msg.reply(`🔮 *Tu ID de vendedor es:* \`${userPhoneNumber}\`\n\nEnvía este código al administrador para que habilite tu número y puedas pedir tus cartones.`);
      return;
    }

    // 2. Check if user is asking to see their assigned cartones list
    if (lowerText === 'cartones') {
      console.log(`[BOT] Solicitud de lista de cartones de ${userPhoneNumber}`);
      
      // Load whitelisted sellers
      let authorized = [];
      try {
        if (fs.existsSync(authorizedFilePath)) {
          const rawAuth = fs.readFileSync(authorizedFilePath, 'utf-8');
          if (rawAuth.trim()) {
            authorized = JSON.parse(rawAuth);
          }
        }
      } catch (err) {
        console.warn('[BOT Warning] No se pudo leer el archivo de autorizados:', err.message);
      }

      const matchedSellerObj = authorized.find(seller => isMatchSellerId(seller, userPhoneNumber));

      if (!matchedSellerObj) {
        await msg.reply(`❌ *Tu número (ID: ${userPhoneNumber}) no está habilitado para solicitar cartones.* \n\nEnvía la palabra *id* para obtener tu identificador de vendedor y compártelo con el administrador.`);
        return;
      }

      const registeredName = typeof matchedSellerObj === 'object' ? (matchedSellerObj.name || '') : '';

      // Load seller rows
      let sellerRows = [];
      try {
        if (fs.existsSync(sellerRowsFilePath)) {
          const rawRows = fs.readFileSync(sellerRowsFilePath, 'utf-8');
          if (rawRows.trim()) {
            sellerRows = JSON.parse(rawRows);
          }
        }
      } catch (err) {
        console.warn('[BOT Warning] No se pudo leer el archivo de filas:', err.message);
      }

      // Find ALL rows assigned to this seller (by name, phone number, or registered ID)
      const matchedSellerRows = sellerRows.filter(row => isRowMatchingSeller(row, registeredName, userPhoneNumber, matchedSellerObj));

      if (matchedSellerRows.length === 0) {
        const displayName = registeredName || `+${userPhoneNumber}`;
        await msg.reply(`❌ *Hola. No tienes cartones asignados, pide que te asignen cartones ${displayName}*`);
        return;
      }

      // Combine all numbers from all matched rows
      const allNumbers = matchedSellerRows.flatMap(row => row.numbers);

      // Build the combined list message
      const displayName = registeredName || 'Vendedor';
      let replyMessage = `🎟️ *TUS CARTONES ASIGNADOS* 🎟️\n━━━━━━━━━━━━━━━━━━\nHola *${displayName}*, tienes los siguientes *${allNumbers.length} cartones* asignados para vender:\n\n`;
      
      allNumbers.forEach((num) => {
        const paddedNum = String(parseInt(num, 10)).padStart(5, '0');
        replyMessage += `👉 Cartón *#${paddedNum}*\n`;
      });
      
      replyMessage += `\n━━━━━━━━━━━━━━━━━━\nPara descargar cualquiera de ellos, simplemente escribe el número del cartón (ejemplo: *${parseInt(allNumbers[0], 10)}*). 🍀`;
      
      await msg.reply(replyMessage);
      return;
    }

    // 3. Check if user is asking for a gift ticket
    if (lowerText === 'regalo' || lowerText === 'regalos') {
      await msg.reply('❌ *La función de cartones de regalo ha sido desactivada por el administrador.*');
      return;
    }

    // Check if user is asking for specific tickets (e.g. "34,59,1443")
    const ticketNumbers = extractTicketNumbers(lowerText);

    if (ticketNumbers.length > 0) {
      console.log(`[BOT] Solicitud de Cartones [${ticketNumbers.join(', ')}] de ${msg.from}`);
      
      // Check if user is authorized to request tickets (Central Database Habilitation Check)
      let authorized = [];
      try {
        if (fs.existsSync(authorizedFilePath)) {
          const rawAuth = fs.readFileSync(authorizedFilePath, 'utf-8');
          if (rawAuth.trim()) {
            authorized = JSON.parse(rawAuth);
          }
        }
      } catch (err) {
        console.warn('[BOT Warning] No se pudo leer el archivo de autorizados:', err.message);
      }

      const isAuthorized = authorized.some(seller => isMatchSellerId(seller, userPhoneNumber));

      if (!isAuthorized) {
        console.log(`[BOT Block] Solicitud no autorizada de +${userPhoneNumber} para cartones [${ticketNumbers.join(', ')}]`);
        await msg.reply(`❌ *Tu número (ID de vendedor: ${userPhoneNumber}) no está habilitado para solicitar cartones.* \n\nPara solicitar tu habilitación, envía la palabra *id* para obtener tu identificador de vendedor y compártelo con el administrador.`);
        return;
      }

      // Get seller registered name for dynamic row allocation check
      const matchedSellerObj = authorized.find(seller => isMatchSellerId(seller, userPhoneNumber));
      const registeredName = (matchedSellerObj && typeof matchedSellerObj === 'object') ? (matchedSellerObj.name || '') : '';

      // 2. Fila (Row) Allocation Security Validation
      let sellerRows = [];
      try {
        if (fs.existsSync(sellerRowsFilePath)) {
          const rawRows = fs.readFileSync(sellerRowsFilePath, 'utf-8');
          if (rawRows.trim()) {
            sellerRows = JSON.parse(rawRows);
          }
        }
      } catch (err) {
        console.warn('[BOT Warning] No se pudo leer el archivo de filas de vendedores:', err.message);
      }

      // Find ALL rows assigned to this seller (by name, phone number, or registered ID)
      const matchedSellerRows = sellerRows.filter(row => isRowMatchingSeller(row, registeredName, userPhoneNumber, matchedSellerObj));

      if (matchedSellerRows.length === 0) {
        console.log(`[BOT Block] Vendedor +${userPhoneNumber} (${registeredName || 'Sin Nombre'}) no tiene filas asignadas.`);
        const displayName = registeredName || `+${userPhoneNumber}`;
        await msg.reply(`❌ *Hola. No tienes cartones asignados, pide que te asignen cartones ${displayName}*`);
        return;
      }

      // Combine all numbers from all matched rows and check if ticket belongs to any of them
      const allAssignedNumbers = matchedSellerRows.flatMap(row => row.numbers);
      const allAssignedNumbersSet = new Set(allAssignedNumbers.map(num => String(parseInt(num, 10))));

      // Reload ticketsData if empty to ensure it's synced with any recent website upload
      if (ticketsData.length === 0 && fs.existsSync(ticketsFilePath)) {
        try {
          ticketsData = JSON.parse(fs.readFileSync(ticketsFilePath, 'utf8'));
        } catch (e) {}
      }

      if (ticketsData.length === 0) {
        await msg.reply('❌ *Lo sentimos, la base de datos de cartones no ha sido cargada aún en el servidor.* Carga tu base de datos desde la sección de Generador en el sitio web.');
        return;
      }

      // Load current logs to check for duplicates
      let logs = [];
      try {
        if (fs.existsSync(downloadsFilePath)) {
          const rawLogs = fs.readFileSync(downloadsFilePath, 'utf-8');
          if (rawLogs.trim()) {
            logs = JSON.parse(rawLogs);
          }
        }
      } catch (err) {
        console.warn('[BOT Warning] Error al leer logs de descargas:', err.message);
      }

      const toProcess = [];
      const errors = [];

      for (const ticketNumber of ticketNumbers) {
        const numClean = String(parseInt(ticketNumber, 10));

        // Check if assigned to this seller
        if (!allAssignedNumbersSet.has(numClean)) {
          errors.push(`❌ *El cartón #${ticketNumber}* no está asignado a tu fila de ventas.`);
          continue;
        }

        // Find ticket in synced database
        const ticket = ticketsData.find(t => t.ticket_number === ticketNumber);
        if (!ticket) {
          errors.push(`❌ *El cartón #${ticketNumber}* no existe en la base de datos cargada.`);
          continue;
        }

        // Check if ticket was already requested/downloaded
        const alreadyRequested = logs.some(log => {
          return String(parseInt(log.ticketNumber, 10)) === numClean;
        });

        if (alreadyRequested) {
          errors.push(`❌ *El cartón #${ticketNumber}* ya fue solicitado previamente y no puede ser entregado de nuevo.`);
          continue;
        }

        toProcess.push({ ticketNumber, ticket });
      }

      // If we have errors, send them to the user
      if (errors.length > 0) {
        await client.sendMessage(msg.from, errors.join('\n'));
      }

      if (toProcess.length === 0) {
        return;
      }

      // Inform user we are starting generation
      const countMsg = toProcess.length === 1 ? `tu cartón *#${toProcess[0].ticketNumber}*` : `tus *${toProcess.length}* cartones`;
      await client.sendMessage(msg.from, `🔮 _Generando la(s) tarjeta(s) premium de ${countMsg}..._`);

      // Find seller name for high fidelity logs
      let sellerName = 'Desconocido';
      let sellerPhone = userPhoneNumber;
      const matchedSeller = authorized.find(seller => {
        const sId = (typeof seller === 'object' && seller !== null) ? seller.id : seller;
        return String(sId).trim() === String(userPhoneNumber).trim();
      });
      if (matchedSeller && typeof matchedSeller === 'object') {
        sellerName = matchedSeller.name || 'Sin Nombre';
      }

      // Process each ticket sequentially
      for (const item of toProcess) {
        const { ticketNumber, ticket } = item;
        try {
          // Render & Send
          const imageBuffer = await renderTicketToImage(ticket);
          const media = new MessageMedia('image/png', imageBuffer.toString('base64'), `carton-${ticketNumber}.png`);
          await client.sendMessage(msg.from, media, { caption: `✅ Aquí tienes tu Cartón *#${ticketNumber}*. ¡Mucha suerte! 🍀` });
          console.log(`[BOT] Imagen del Cartón #${ticketNumber} enviada con éxito.`);

          // Append to log and save immediately (to prevent race conditions/double downloads if they send requests quickly)
          try {
            if (fs.existsSync(downloadsFilePath)) {
              try {
                logs = JSON.parse(fs.readFileSync(downloadsFilePath, 'utf-8'));
              } catch (err) {}
            }
            logs.push({
              ticketNumber: ticketNumber,
              downloadedAt: new Date().toISOString(),
              sellerId: sellerPhone,
              sellerName: sellerName
            });
            fs.writeFileSync(downloadsFilePath, JSON.stringify(logs, null, 2));
            console.log(`[BOT Sync] Solicitud de Cartón #${ticketNumber} registrada en el Panel de Ventas.`);
          } catch (logErr) {
            console.warn('[BOT Warning] No se pudo registrar la descarga en el Panel de Ventas:', logErr.message);
          }
        } catch (err) {
          console.error(`[BOT Error] Error al generar o enviar la imagen del cartón #${ticketNumber}:`, err);
          await client.sendMessage(msg.from, `❌ *Ocurrió un error temporal al intentar renderizar tu cartón #${ticketNumber}.* Por favor, inténtalo de nuevo en unos momentos.`);
        }
      }

      return;
    }

    // Default catch-all instructions if they talk to the bot but don't ask for a number
    const welcomeKeywords = ['hola', 'buen', 'bot', 'info', 'ayuda', 'cómo', 'como'];
    const matchesWelcome = welcomeKeywords.some(w => lowerText.includes(w));
    
    if (matchesWelcome) {
      await msg.reply(`🎱 *¡BIENVENIDO AL BOT DE BINGO EL BOLILLO!* 🎱\nTu asistente automático para el juego.\n━━━━━━━━━━━━━━━━━━\nPor favor, elige una opción respondiendo con la *PALABRA CLAVE* de lo que deseas hacer:\n\n🔑 Escribe *id* para Registrarte / Solicitar tu ID de vendedor.\n🎟️ Escribe *cartones* para Ver tus cartones asignados.\n🔢 Escribe el *número de tu cartón* (ejemplo: *1*, *2*, *42*) para descargarlo.\n━━━━━━━━━━━━━━━━━━\n🍀 _¡Mucha suerte en tus ventas!_ 🍀`);
    }

  } catch (error) {
    console.error('[BOT Error] Error procesando mensaje de WhatsApp:', error);
  }
});

client.on('disconnected', (reason) => {
  console.warn('[BOT Warning] Cliente de WhatsApp desconectado. Razón:', reason);
  botReady = false;
});

client.initialize();

// --- START EXPRESS PORT ---
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor API de Cartones de Bingo escuchando en http://localhost:${PORT}`);
  console.log(`   - Endpoint de Sincronización: POST http://localhost:${PORT}/api/tickets`);
  console.log(`   - Endpoint de Webhook WhatsApp: POST http://localhost:${PORT}/api/whatsapp/webhook\n`);
});
