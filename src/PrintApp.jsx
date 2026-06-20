import { useState } from 'react'
import { FileUp, Download, Home } from 'lucide-react'
import { jsPDF } from 'jspdf'
import comicKids from './assets/comic_kids.png'
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
      const logoB64 = await loadImageAsBase64(comicKids)
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
        doc.setFillColor(230, 242, 254) // Soft light blue background
        doc.setDrawColor(8, 26, 54) // Dark blue border
        doc.setLineWidth(1.2)
        doc.roundedRect(X, Y, TW, TH, 6, 6, 'FD')

        // ── Inner sketchy border ──
        doc.setDrawColor(8, 26, 54)
        doc.setLineWidth(0.4)
        doc.roundedRect(X + 1.2, Y + 1.2, TW - 2.4, TH - 2.4, 5.2, 5.2, 'D')

        // ── Header Card Number Top Left ──
        doc.setTextColor(8, 26, 54)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text(`Nº ${ticket.ticket_number}`, X + 4, Y + 6)

        // ── Speech Bubble Title ──
        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(8, 26, 54)
        doc.setLineWidth(0.8)
        doc.roundedRect(X + (TW - 56) / 2, Y + 8, 56, 17, 4, 4, 'FD')

        // Title speech bubble tail
        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(8, 26, 54)
        doc.setLineWidth(0.8)
        const bx = X + (TW - 56) / 2 + 10
        const by = Y + 25
        doc.triangle(bx, by, bx + 4, by, bx + 2, by + 2, 'FD')
        // remove division line
        doc.setDrawColor(255, 255, 255)
        doc.setLineWidth(1.0)
        doc.line(bx + 0.5, by, bx + 3.5, by)

        // Title Texts
        doc.setTextColor(249, 115, 22) // Orange-yellow color
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.text('BINGO', X + TW / 2, Y + 14, { align: 'center' })
        doc.setFontSize(12)
        doc.text('FAMILIAR', X + TW / 2, Y + 20, { align: 'center' })

        // ── Middle row ──
        doc.saveGraphicsState()
        doc.addImage(logoB64, 'PNG', X + 5, Y + 27, 24, 11)
        doc.restoreGraphicsState()

        doc.setTextColor(8, 26, 54)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.text('3x15', X + 39, Y + 31)
        doc.text('FLOWER', X + 39, Y + 36)

        // ── BINGO letter header row ──
        const pad = 4
        const hRowY = Y + 40
        const mW = TW - pad * 2
        const cW = mW / 5
        const cH = 15 // cell height

        doc.setDrawColor(8, 26, 54)
        doc.setLineWidth(0.6)
        doc.line(X + pad, hRowY, X + TW - pad, hRowY)
        doc.line(X + pad, hRowY + 7.5, X + TW - pad, hRowY + 7.5)

        BINGO_LETTERS.forEach((l, i) => {
          const hX = X + pad + i * cW
          doc.setTextColor(8, 26, 54)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.text(l, hX + cW / 2, hRowY + 5.5, { align: 'center' })
        })

        // ── Number grid ──
        const gridY = hRowY + 10.5
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const val = ticket.matrix[r][c]
            const cX = X + pad + c * cW
            const cY = gridY + r * cH
            const free = val === 0

            if (free) {
              doc.setFillColor(254, 240, 138) // light yellow
              doc.setDrawColor(8, 26, 54)
              doc.setLineWidth(0.6)
              doc.roundedRect(cX + 0.8, cY + 0.8, cW - 1.6, cH - 1.6, 2.5, 2.5, 'FD')

              doc.setTextColor(220, 38, 38)
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(9)
              doc.text('FREE!', cX + cW/2, cY + cH/2 + 3.0, { align: 'center' })
            } else {
              doc.setFillColor(240, 249, 255) // light blue
              doc.setDrawColor(8, 26, 54)
              doc.setLineWidth(0.6)
              doc.roundedRect(cX + 0.8, cY + 0.8, cW - 1.6, cH - 1.6, 2.5, 2.5, 'FD')

              doc.setTextColor(8, 26, 54)
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(13)
              doc.text(String(val), cX + cW/2, cY + cH/2 + 4.2, { align: 'center' })
            }
          }
        }

        // ── Footer ──
        const footerY = Y + TH - 4
        doc.setDrawColor(8, 26, 54)
        doc.setLineWidth(0.4)
        doc.line(X + 10, Y + TH - 7.5, X + TW - 10, Y + TH - 7.5)

        doc.setTextColor(8, 26, 54)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.text('EDICIÓN 75 FAMILIAR', X + 10, footerY)
        doc.text('♦ BINGO FAMILIAR', X + TW - 10, footerY, { align: 'right' })

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
