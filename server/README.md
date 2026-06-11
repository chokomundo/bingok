# 🔮 Bingo Black - API y Bot de WhatsApp de Cartones (Limpios)

Este directorio contiene el servidor backend en Node.js + Express y el Bot de WhatsApp integrado para tu sistema de bingo. Permite a los jugadores recibir una imagen limpia de alta definición de sus cartones al enviar el número de cartón al bot.

No realiza marcado de números, validación o comprobación; está diseñado exclusivamente para **repartir y entregar los cartones en formato de imagen digital** de forma gratuita y automática.

---

## 🚀 Requisitos e Instalación

### 1. Requisitos
- **Node.js**: Versión 18 o superior instalada.
- **npm**: Gestor de paquetes oficial de Node.js.

### 2. Instalación
Las dependencias ya están listas en esta carpeta. En caso de requerir reinstalación en un nuevo entorno o VPS, ejecuta:
```bash
npm install
```

---

## 🎮 Cómo Operar el Sistema (Paso a Paso)

### Paso 1: Levantar el Bot de WhatsApp y la API
Abre una terminal en este directorio (`/server`) y ejecuta:
```bash
npm start
```

### Paso 2: Vincular WhatsApp
1. En el primer arranque, el bot imprimirá un **código QR de texto** directamente en tu consola de comandos.
2. Abre la aplicación de WhatsApp en tu teléfono celular.
3. Ve a **Configuración > Dispositivos Vinculados > Vincular un dispositivo**.
4. Escanea el código QR de la consola.
5. Verás el mensaje: `[BOT] ¡CONEXIÓN EXITOSA! El bot de WhatsApp está listo para entregar cartones.` El bot mantendrá la sesión abierta en `/sessions`.

### Paso 3: Subir los Cartones desde la Página de Generador
1. Abre tu terminal raíz (`/bingok`) y ejecuta `npm run dev` para levantar el sitio de Bingo.
2. Navega a la sección **Generador de Base de Datos** (`#/generator`).
3. En la interfaz verás un nuevo panel: **"¿Ya tienes cartones? Sube tu archivo JSON para el bot"**.
4. Haz clic en **Sincronizar archivo bingo_tickets.json** y selecciona tu archivo de cartones.
5. **¡Listo!** El sitio web se conectará de inmediato con la API en segundo plano y verás el mensaje: **`¡X Cartones sincronizados con el Bot de WhatsApp!`**
6. También puedes hacer clic en **GENERAR CARTONES** y se sincronizarán de forma automática e inmediata con el Bot en el momento de su creación.

---

## 📱 Interacción en WhatsApp (Para tus Jugadores)

### 1. Obtener la Tarjeta del Cartón en Imagen PNG
Cualquier persona en el WhatsApp del bot puede ingresar un número de cartón (ej. `carton 42`, `00042` o simplemente `42`). El bot normalizará el número a 5 dígitos (`00042`), buscará el cartón en la base de datos sincronizada y responderá de la siguiente forma:

1. 🔮 _Generando la tarjeta premium de tu cartón *#00042*..._
2. **[Imagen Adjunta .PNG]**: Envía el cartón renderizado en alta definición, con sus colores morados, diseño del tapete, tipografía premium y marca de agua, **completamente limpio y listo para jugar**.
3. Leyenda del mensaje: *`✅ Aquí tienes tu Cartón #00042. ¡Mucha suerte! 🍀`*

### 2. Mensaje de Bienvenida e Instrucciones
Si un jugador saluda al bot con palabras comunes (ej. `hola`, `ayuda`, `info`), el bot le enviará una respuesta explicándole cómo obtener su cartón:
> 🔮 **BIENVENIDO AL BOT DE BINGO BLACK** 🔮
> ━━━━━━━━━━━━━━━━━━
> Para recibir la imagen de tu cartón, simplemente responde escribiendo **el número de tu cartón** (ejemplo: *carton 42*, *00042* o simplemente *42*).
> 
> ¡Te la enviaremos al instante! ¡Mucha suerte! 🍀

---

## 🌐 Despliegue en VPS (Producción)

Si planeas subir este servidor a tu propio VPS en la nube:
1. Configura la dirección IP o dominio de tu servidor backend en el frontend creando un archivo `.env` en la raíz de la web de bingo:
   ```env
   VITE_API_URL=https://tu-dominio-o-ip-vps.com
   ```
2. Instala las dependencias gráficas de Linux y Chromium para que Puppeteer funcione en tu VPS (ej. Ubuntu Server):
   ```bash
   sudo apt-get update
   sudo apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release xdg-utils wget
   ```
3. Levanta y administra el proceso del bot en segundo plano usando **PM2**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "bingo-bot"
   ```
