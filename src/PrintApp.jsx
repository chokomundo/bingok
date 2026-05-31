import { useState } from 'react'
import { FileUp, Download, Home } from 'lucide-react'
import { jsPDF } from 'jspdf'
import solibingoLogo from './assets/solibingo_hero.png'
import BingoCard from './components/BingoCard.jsx'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']

// PDF: same colors as RGB arrays
const HEADER_COLORS_PDF = [
  [220, 31, 60], [255, 140, 0], [34, 197, 94], [6, 182, 212], [139, 92, 246]
]
const TITLE_COLORS_PDF = [
  [255, 87, 87], [255, 215, 0], [76, 217, 100], [90, 200, 250], [191, 127, 255]
]

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
      const logoB64 = await loadImageAsBase64(solibingoLogo)
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
        doc.setFillColor(15, 13, 21) // Near black
        doc.setDrawColor(107, 33, 168) // Purple-800
        doc.setLineWidth(2.0)
        doc.roundedRect(X, Y, TW, TH, 6, 6, 'FD')

        const pad = 4
        const headH = 20

        // ── Header Panel ──
        doc.setFillColor(25, 20, 35) // Deep purple-black
        doc.setDrawColor(88, 28, 135) // Purple-900
        doc.setLineWidth(0.4)
        doc.roundedRect(X + pad, Y + pad, TW - pad * 2, headH, 3.5, 3.5, 'FD')

        // ── Header Card Number Top Left ──
        doc.setTextColor(168, 85, 247) // Purple-400
        doc.setFont('times', 'bold')
        doc.setFontSize(7.5)
        doc.text(`N° ${ticket.ticket_number}`, X + pad + 2.5, Y + pad + 3.2)

        // ── Header Title text ──
        doc.setTextColor(239, 234, 246) // Creamy white
        doc.setFont('times', 'bold')
        doc.setFontSize(18)
        doc.text('BINGO BLACK', X + TW / 2, Y + pad + 7.5, { align: 'center' })

        // ── Header Subtitle text "3 x 15" ──
        doc.setTextColor(168, 85, 247) // Purple-400
        doc.setFont('times', 'italic')
        doc.setFontSize(8.5)
        doc.text('❀   3 x 15   ❀', X + TW / 2, Y + pad + 14, { align: 'center' })

        // ── BINGO letter header row ──
        const hRowY = Y + pad + headH + 3
        const mW = TW - pad * 2
        const cW = mW / 5
        const cH = 15 // cell height

        doc.setFillColor(32, 28, 39) // Gray header background
        doc.setDrawColor(88, 28, 135) // Purple-900
        doc.setLineWidth(0.4)
        doc.roundedRect(X + pad, hRowY, mW, 8.5, 2, 2, 'FD')

        BINGO_LETTERS.forEach((l, i) => {
          const hX = X + pad + i * cW
          doc.setTextColor(216, 180, 254) // Purple-300
          doc.setFont('times', 'bold')
          doc.setFontSize(11)
          doc.text(l, hX + cW / 2, hRowY + 6, { align: 'center' })
        })

        // ── Number grid ──
        const gridY = hRowY + 11

        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const val = ticket.matrix[r][c]
            const cX = X + pad + c * cW
            const cY = gridY + r * cH
            const free = val === 0

            if (free) {
              doc.setFillColor(37, 18, 61) // Deep purple
              doc.setDrawColor(168, 85, 247) // Purple-400
            } else {
              doc.setFillColor(34, 29, 42) // Dark charcoal
              doc.setDrawColor(74, 33, 118) // Purple-700
            }
            doc.setLineWidth(0.5)
            doc.roundedRect(cX + 0.8, cY + 0.8, cW - 1.6, cH - 1.6, 2.5, 2.5, 'FD')

            // Nested inner border for depth
            doc.setDrawColor(15, 10, 25, 30)
            doc.setLineWidth(0.2)
            doc.roundedRect(cX + 1.4, cY + 1.4, cW - 2.8, cH - 2.8, 2.0, 2.0, 'D')

            if (free) {
              doc.setTextColor(216, 180, 254) // Purple-300
              doc.setFont('times', 'bold')
              doc.setFontSize(11); doc.text('▲', cX + cW/2, cY + 5.0, { align: 'center' })
              doc.setFontSize(6.0); doc.text('FREE', cX + cW/2, cY + 8.5, { align: 'center' })
              doc.setFontSize(11); doc.text('▼', cX + cW/2, cY + 13.0, { align: 'center' })
            } else {
              doc.setTextColor(239, 234, 246) // Creamy white
              doc.setFont('times', 'bold')
              doc.setFontSize(13)
              doc.text(String(val), cX + cW/2, cY + cH/2 + 4.0, { align: 'center' })
            }
          }
        }

        // ── Watermark ──
        const gridH = 5 * cH
        const wmW = TW * 0.62, wmH = wmW * 0.40
        const wmX = X + (TW - wmW) / 2
        const wmY2 = gridY + (gridH - wmH) / 2
        doc.saveGraphicsState()
        doc.setGState(doc.GState({ opacity: 0.07 }))
        doc.addImage(logoB64, 'PNG', wmX, wmY2, wmW, wmH)
        doc.restoreGraphicsState()

        // ── Footer ──
        const footerY = Y + TH - 3.5
        doc.setTextColor(168, 85, 247) // Purple-400
        doc.setFont('times', 'bold')
        doc.setFontSize(6.5)
        doc.text('BLACK 75 EDITION', X + pad + 2, footerY)



        idx++
      }

      doc.save('solibingo_cartones.pdf')
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
                className="flex items-center gap-2 px-6 py-4 bg-[#26105F] text-white rounded-xl cursor-pointer hover:bg-[#1a0a45] transition-colors shadow-md font-bold disabled:opacity-50">
                <Download className="w-5 h-5" />
                {isGenerating ? 'Generando PDF...' : 'Descargar en PDF'}
              </button>
            )}
          </div>
        </div>
      </div>

      {(isLoading || isGenerating) && (
        <div className="p-12 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4" />
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
