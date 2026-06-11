import { useState } from 'react'
import { FileUp, Download, Home } from 'lucide-react'
import { jsPDF } from 'jspdf'
import horseWatermark from './assets/horse_watermark.png'
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

        // ── Header Card Number Top Left ──
        doc.setTextColor(84, 40, 19) // Dark brown
        doc.setFont('times', 'bold')
        doc.setFontSize(8)
        doc.text(`Nº ${ticket.ticket_number}`, X + 4, Y + 6)

        // ── Header Title text ──
        doc.setTextColor(84, 40, 19)
        doc.setFont('times', 'bold')
        doc.setFontSize(22)
        doc.text('BINGO', X + TW / 2, Y + 13, { align: 'center' })

        doc.setFontSize(18)
        doc.text('CHAQUEÑO', X + TW / 2, Y + 20, { align: 'center' })

        // ── Header Subtitle text "3 x 15" ──
        doc.setFontSize(8)
        doc.text('✿   3 x 15   ✿', X + TW / 2, Y + 24.5, { align: 'center' })

        // Thin line dividers on the sides of the subtitle
        doc.setDrawColor(142, 109, 79)
        doc.setLineWidth(0.15)
        doc.line(X + 12, Y + 24, X + TW/2 - 10, Y + 24)
        doc.line(X + TW/2 + 10, Y + 24, X + TW - 12, Y + 24)

        // ── BINGO letter header row ──
        const hRowY = Y + 28
        const mW = TW - pad * 2
        const cW = mW / 5
        const cH = 15 // cell height

        doc.setDrawColor(142, 109, 79)
        doc.setLineWidth(0.25)
        doc.line(X + pad, hRowY, X + TW - pad, hRowY)
        doc.line(X + pad, hRowY + 6.5, X + TW - pad, hRowY + 6.5)

        BINGO_LETTERS.forEach((l, i) => {
          const hX = X + pad + i * cW
          doc.setTextColor(84, 40, 19)
          doc.setFont('times', 'bold')
          doc.setFontSize(11)
          doc.text(l, hX + cW / 2, hRowY + 4.8, { align: 'center' })
        })

        // ── Watermark behind numbers ──
        const gridY = hRowY + 9
        const gridH = 5 * cH
        const wmW = TW * 0.72, wmH = wmW // Square watermark
        const wmX = X + (TW - wmW) / 2
        const wmY2 = gridY + (gridH - wmH) / 2
        doc.saveGraphicsState()
        doc.setGState(doc.GState({ opacity: 0.16 }))
        doc.addImage(logoB64, 'PNG', wmX, wmY2, wmW, wmH)
        doc.restoreGraphicsState()

        // ── Number grid ──
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const val = ticket.matrix[r][c]
            const cX = X + pad + c * cW
            const cY = gridY + r * cH
            const free = val === 0

            // Fill cell with soft parchment color
            doc.setFillColor(253, 250, 245)
            doc.setDrawColor(200, 185, 166)
            doc.setLineWidth(0.4)
            doc.roundedRect(cX + 0.8, cY + 0.8, cW - 1.6, cH - 1.6, 2.0, 2.0, 'FD')

            // Nested inner border
            doc.setDrawColor(142, 109, 79, 20)
            doc.setLineWidth(0.15)
            doc.roundedRect(cX + 1.2, cY + 1.2, cW - 2.8, cH - 2.8, 1.6, 1.6, 'D')

            if (free) {
              doc.setTextColor(142, 109, 79)
              doc.setFont('times', 'bold')
              doc.setFontSize(9); doc.text('▲', cX + cW/2, cY + 4.8, { align: 'center' })
              
              doc.setTextColor(84, 40, 19)
              doc.setFontSize(5.5); doc.text('FREE', cX + cW/2, cY + 8.2, { align: 'center' })
              
              doc.setTextColor(142, 109, 79)
              doc.setFontSize(9); doc.text('▼', cX + cW/2, cY + 12.5, { align: 'center' })
            } else {
              doc.setTextColor(84, 40, 19)
              doc.setFont('times', 'bold')
              doc.setFontSize(13)
              doc.text(String(val), cX + cW/2, cY + cH/2 + 4.2, { align: 'center' })
            }
          }
        }

        // ── Footer ──
        const footerY = Y + TH - 4.5
        doc.setDrawColor(142, 109, 79)
        doc.setLineWidth(0.2)
        doc.line(X + 10, Y + TH - 8, X + TW - 10, Y + TH - 8)

        doc.setTextColor(142, 109, 79)
        doc.setFont('times', 'bold')
        doc.setFontSize(7)
        doc.text('♦ BLACK 75 EDITION', X + TW / 2, footerY, { align: 'center' })

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
