import { useState } from 'react'
import { FileUp, Download, Home } from 'lucide-react'
import { jsPDF } from 'jspdf'
import horseWatermark from './assets/horse_watermark.png'
import bolilloLogo from './assets/bolillo_logo.jpg'
import BingoCard from './components/BingoCard.jsx'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']

export default function PrintApp() {
  const [tickets, setTickets] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        Array.isArray(data) ? setTickets(data) : alert('Formato incorrecto.')
      } catch { alert('Error al leer el JSON.') }
      setIsLoading(false)
    }
    reader.readAsText(file)
  }

  const loadImageAsBase64 = (src) => new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width; c.height = img.height
      c.getContext('2d').drawImage(img, 0, 0)
      res(c.toDataURL('image/png'))
    }
    img.onerror = rej
    img.src = src
  })

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const logoB64 = await loadImageAsBase64(horseWatermark)
      const bolilloBase64 = await loadImageAsBase64(bolilloLogo).catch(() => null)
      const doc = new jsPDF('p', 'mm', 'a4')
      const PW = doc.internal.pageSize.getWidth()  // 210mm

      const margin  = 8
      const spacing = 8
      const TW = (PW - margin * 2 - spacing) / 2  // ~93mm
      const TH = 132

      let idx = 0
      while (idx < tickets.length) {
        if (idx > 0 && idx % 4 === 0) doc.addPage()

        const pos = idx % 4
        const col = pos % 2
        const row = Math.floor(pos / 2)
        const X = margin + col * (TW + spacing)
        const Y = margin + row * (TH + spacing)
        const ticket = tickets[idx]

        // ── Card background ──
        doc.setFillColor(251, 246, 235) // Warm cream/parchment background color
        doc.setDrawColor(142, 109, 79) // Sepia/brown border
        doc.setLineWidth(1.2)
        doc.roundedRect(X, Y, TW, TH, 6, 6, 'FD')

        // ── Inner dashed border ──
        doc.setDrawColor(142, 109, 79)
        doc.setLineWidth(0.3)
        doc.setLineDashPattern([2, 2], 0)
        doc.roundedRect(X + 2, Y + 2, TW - 4, TH - 4, 5, 5, 'D')
        doc.setLineDashPattern([], 0) // reset dash pattern

        // Decorative corner dots
        doc.setFillColor(142, 109, 79)
        doc.circle(X + 3.5, Y + 3.5, 0.6, 'F')
        doc.circle(X + TW - 3.5, Y + 3.5, 0.6, 'F')
        doc.circle(X + 3.5, Y + TH - 3.5, 0.6, 'F')
        doc.circle(X + TW - 3.5, Y + TH - 3.5, 0.6, 'F')

        const pad = 4
        const headH = 20

        const formattedNum = String(ticket.ticket_number || 1).padStart(6, '0')
        const valText = ticket.price || '20 BS'

        // ── Outer Card Background ──
        doc.setFillColor(250, 246, 239) // #FAF6EF
        doc.roundedRect(X, Y, TW, TH, 3, 3, 'F')

        // Outer Gold Border
        doc.setDrawColor(197, 160, 82) // #C5A052
        doc.setLineWidth(0.8)
        doc.roundedRect(X, Y, TW, TH, 3, 3, 'D')

        // Inner Thin Gold Border
        doc.setLineWidth(0.2)
        doc.roundedRect(X + 1, Y + 1, TW - 2, TH - 2, 2.5, 2.5, 'D')

        // ── Top Header Section ──
        // Logo Left
        if (bolilloBase64) {
          doc.addImage(bolilloBase64, 'JPEG', X + 3, Y + 3, 16, 16)
        }

        // Ribbon Middle: TABLA # & Padded Number
        doc.setFillColor(139, 26, 26) // #8B1A1A
        doc.rect(X + TW/2 - 12, Y + 3, 24, 4, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFont('times', 'bold')
        doc.setFontSize(7)
        doc.text('CARTÓN #', X + TW / 2, Y + 6, { align: 'center' })

        doc.setTextColor(17, 17, 17)
        doc.setFontSize(16)
        doc.text(formattedNum, X + TW / 2, Y + 15, { align: 'center' })

        // Right: VALOR & Price
        doc.setTextColor(139, 26, 26)
        doc.setFontSize(7)
        doc.text('VALOR:', X + TW - 11, Y + 6, { align: 'center' })

        doc.setDrawColor(197, 160, 82)
        doc.setLineWidth(0.2)
        doc.line(X + TW - 18, Y + 7.5, X + TW - 4, Y + 7.5)
        doc.line(X + TW - 18, Y + 14.5, X + TW - 4, Y + 14.5)

        doc.setTextColor(17, 17, 17)
        doc.setFontSize(10)
        doc.text(valText, X + TW - 11, Y + 12.5, { align: 'center' })

        // ── 5x5 Grid Section ──
        const gridY = Y + 20
        const mW = TW - pad * 2
        const cW = mW / 5
        const cH = 14

        // Grid Frame
        doc.setDrawColor(197, 160, 82)
        doc.setLineWidth(0.5)
        doc.roundedRect(X + pad, gridY, mW, 6 + 5 * cH, 1, 1, 'D')

        // Header Bar (B I N G O)
        doc.setFillColor(139, 26, 26)
        doc.rect(X + pad, gridY, mW, 6, 'F')

        doc.setDrawColor(197, 160, 82)
        doc.setLineWidth(0.3)
        doc.line(X + pad, gridY + 6, X + TW - pad, gridY + 6)

        BINGO_LETTERS.forEach((l, i) => {
          const hX = X + pad + i * cW
          doc.setTextColor(226, 192, 112) // Gold text
          doc.setFont('times', 'bold')
          doc.setFontSize(11)
          doc.text(l, hX + cW / 2, gridY + 4.5, { align: 'center' })
        })

        // Grid Cells
        const cellsStartY = gridY + 6
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const val = ticket.matrix[r][c]
            const cX = X + pad + c * cW
            const cY = cellsStartY + r * cH
            const free = val === 0

            doc.setFillColor(free ? 245 : 255, free ? 238 : 253, free ? 227 : 249)
            doc.setDrawColor(197, 160, 82)
            doc.setLineWidth(0.2)
            doc.rect(cX, cY, cW, cH, 'FD')

            if (free) {
              // Circular Red Medallion
              const rad = Math.min(cW, cH) * 0.35
              doc.setFillColor(139, 26, 26)
              doc.setDrawColor(197, 160, 82)
              doc.setLineWidth(0.4)
              doc.circle(cX + cW/2, cY + cH/2, rad, 'FD')

              doc.setTextColor(226, 192, 112)
              doc.setFont('times', 'bold')
              doc.setFontSize(8)
              doc.text('B', cX + cW/2, cY + cH/2 + 2.5, { align: 'center' })
            } else {
              doc.setTextColor(17, 17, 17)
              doc.setFont('times', 'bold')
              doc.setFontSize(12)
              doc.text(String(val), cX + cW/2, cY + cH/2 + 3.8, { align: 'center' })
            }
          }
        }

        // ── Footer Ribbon ──
        const footerY = Y + TH - 4
        doc.setFillColor(139, 26, 26)
        doc.rect(X + TW/2 - 14, Y + TH - 7, 28, 4, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFont('times', 'bold')
        doc.setFontSize(6.5)
        doc.text('¡BUENA SUERTE!', X + TW / 2, footerY, { align: 'center' })

        idx++
      }

      doc.save('bolillo_cartones.pdf')
    } catch (err) {
      alert('Error al generar el PDF: ' + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGoHome = () => { window.location.hash = '' }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* Controls */}
      <div className="p-6 bg-slate-50 border-b border-slate-200 shadow-sm flex flex-col items-center">
        <div className="w-full max-w-5xl flex items-center justify-between mb-8">
          <button onClick={handleGoHome}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 transition-all cursor-pointer font-medium shadow-sm">
            <Home className="w-4 h-4" /> Volver al Hub
          </button>
        </div>
        <div className="max-w-2xl w-full text-center space-y-6">
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Visor y Descargador de Cartones</h1>
          <p className="text-slate-500">Sube el archivo <code className="bg-slate-200 px-1 rounded text-red-600 font-bold">bingo_tickets.json</code> y descárgalos en PDF.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <label className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-dashed border-[#E8174C]/40 text-[#E8174C] rounded-xl cursor-pointer hover:bg-rose-50 transition-colors shadow-sm font-bold">
              <FileUp className="w-5 h-5" />
              <span>Cargar Archivo JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            {tickets.length > 0 && (
              <button onClick={handleGeneratePDF} disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-4 bg-[#8B1A1A] text-white rounded-xl cursor-pointer hover:bg-[#520f0f] transition-colors shadow-md font-bold disabled:opacity-50">
                <Download className="w-5 h-5" />
                {isGenerating ? 'Generando PDF...' : 'Descargar en PDF'}
              </button>
            )}
          </div>
        </div>
      </div>

      {(isLoading || isGenerating) && (
        <div className="p-12 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-bold">
            {isGenerating ? `Procesando ${tickets.length} cartones...` : 'Cargando...'}
          </p>
        </div>
      )}

      {/* Preview grid */}
      {!isLoading && !isGenerating && tickets.length > 0 && (
        <div className="p-8">
          <h2 className="text-center text-slate-500 font-bold mb-6">
            Vista Previa — primeros {Math.min(tickets.length, 12)} de {tickets.length}
          </h2>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.slice(0, 12).map((ticket) => (
              <BingoCard key={ticket.ticket_number} ticket={ticket} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
