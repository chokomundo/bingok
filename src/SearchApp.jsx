import { useState, useCallback, useEffect } from 'react'
import { Search, Download, Sparkles, AlertCircle, ArrowLeft, Ticket, CheckCircle2 } from 'lucide-react'
import horseWatermark from './assets/horse_watermark.png'
import BingoCard from './components/BingoCard.jsx'

// Utility function to draw rounded rectangles on HTML5 Canvas
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function SearchApp() {
  const [tickets, setTickets] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [foundTicket, setFoundTicket] = useState(null)
  const [searchStatus, setSearchStatus] = useState('idle')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // 1. Load local fallback immediately
    let initialTickets = []
    const stored = localStorage.getItem('bingo_tickets_json')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (Array.isArray(data) && data.length > 0) {
          initialTickets = data
          setTickets(data)
          setSearchStatus('idle')
        }
      } catch {}
    }

    // 2. Fetch server-side JSON for sync across all network devices
    fetch('/bingo_tickets.json')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTickets(data)
          setSearchStatus('idle')
          localStorage.setItem('bingo_tickets_json', JSON.stringify(data))
        } else {
          // If server file is empty/inactive and no local fallback
          if (initialTickets.length === 0) {
            setSearchStatus('no_data')
          }
        }
      })
      .catch(() => {
        if (initialTickets.length === 0) {
          setSearchStatus('no_data')
        }
      })
  }, [])

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return
    if (tickets.length === 0) {
      setSearchStatus('no_data')
      return
    }

    const query = searchQuery.trim()
    const ticket = tickets.find(t => 
      t.ticket_number === query || 
      t.ticket_number === query.padStart(5, '0') ||
      String(parseInt(query, 10)) === String(parseInt(t.ticket_number, 10))
    )

    if (ticket) {
      setFoundTicket(ticket)
      setSearchStatus('found')
    } else {
      setFoundTicket(null)
      setSearchStatus('not_found')
    }
  }, [searchQuery, tickets])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  // 100% Bulletproof Canvas 2D drawing to generate crystal-clear PNG image instantly without DOM-parsing issues
  const handleDownloadPNG = () => {
    if (!foundTicket) return
    setIsGenerating(true)

    try {
      const ticket = foundTicket
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 850
      const ctx = canvas.getContext('2d')

      const drawCard = (logoImgLoaded = null) => {
        // 1. Draw Background
        const grad = ctx.createRadialGradient(300, 425, 100, 300, 425, 500)
        grad.addColorStop(0, '#fdfaf5')
        grad.addColorStop(1, '#ecdcc4')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 600, 850)

        // Border
        ctx.strokeStyle = '#8e6d4f'
        ctx.lineWidth = 4
        drawRoundedRect(ctx, 10, 10, 580, 830, 25)
        ctx.stroke()

        // Inner dashed border
        ctx.strokeStyle = 'rgba(142, 109, 79, 0.4)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        drawRoundedRect(ctx, 16, 16, 568, 818, 20)
        ctx.stroke()
        ctx.setLineDash([]) // Reset dash

        // Corner dots
        ctx.fillStyle = '#8e6d4f'
        const dots = [[20, 20], [580, 20], [20, 830], [580, 830]]
        dots.forEach(([dx, dy]) => {
          ctx.beginPath()
          ctx.arc(dx, dy, 3.5, 0, Math.PI * 2)
          ctx.fill()
        })

        // Card Number on Top Left inside Header Panel
        ctx.fillStyle = '#542813'
        ctx.font = 'bold 16px Georgia, serif'
        ctx.textAlign = 'left'
        ctx.fillText(`Nº ${ticket.ticket_number}`, 32, 45)

        // Title
        ctx.font = 'bold 50px Georgia, serif'
        ctx.fillStyle = '#542813'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(84, 40, 19, 0.2)'
        ctx.shadowBlur = 6
        ctx.fillText('BINGO', 300, 95)
        ctx.fillText('CHAQUEÑO', 300, 142)
        ctx.shadowBlur = 0 // reset

        // Subtitle
        ctx.fillStyle = '#8e6d4f'
        ctx.font = '20px Georgia, serif'
        ctx.fillText('✿', 160, 182)
        ctx.fillText('✿', 440, 182)
        
        ctx.strokeStyle = 'rgba(142, 109, 79, 0.4)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(185, 175)
        ctx.lineTo(245, 175)
        ctx.moveTo(355, 175)
        ctx.lineTo(415, 175)
        ctx.stroke()

        ctx.fillStyle = '#542813'
        ctx.font = 'bold 15px Georgia, serif'
        ctx.fillText('3 × 15', 300, 180)

        // 3. Draw BINGO Column Headers Bar
        const hRowY = 210
        const mW = 552
        const cW = mW / 5
        const cH = 100

        ctx.strokeStyle = 'rgba(142, 109, 79, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(24, hRowY)
        ctx.lineTo(576, hRowY)
        ctx.moveTo(24, hRowY + 38)
        ctx.lineTo(576, hRowY + 38)
        ctx.stroke()

        const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']
        BINGO_LETTERS.forEach((l, i) => {
          ctx.fillStyle = '#542813'
          ctx.font = 'bold 26px Georgia, serif'
          ctx.textAlign = 'center'
          ctx.fillText(l, 24 + i * cW + cW / 2, hRowY + 28)
        })

        // Draw Watermark Logo if loaded
        if (logoImgLoaded) {
          ctx.save()
          ctx.globalAlpha = 0.16
          const wmW = 552 * 0.85
          const wmH = wmW // Square watermark
          ctx.drawImage(logoImgLoaded, 300 - wmW/2, 531 - wmH/2, wmW, wmH)
          ctx.restore()
        }

        // Draw cells
        const cellW = 100
        const cellH = 100
        const gap = 8
        const startX = 24 + 10 // padding
        const startY = 265

        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const val = ticket.matrix[r][c]
            const cX = startX + c * (cellW + gap)
            const cY = startY + r * (cellH + gap)
            const free = val === 0

            // Fill
            ctx.fillStyle = free ? 'rgba(253, 251, 247, 0.65)' : 'rgba(253, 251, 247, 0.82)'
            ctx.strokeStyle = free ? '#8e6d4f' : '#c8b9a6'
            ctx.lineWidth = 2
            drawRoundedRect(ctx, cX, cY, cellW, cellH, 12)
            ctx.fill()
            ctx.stroke()

            // Nested inner thin border
            ctx.strokeStyle = 'rgba(142, 109, 79, 0.15)'
            ctx.lineWidth = 1
            drawRoundedRect(ctx, cX + 2, cY + 2, cellW - 4, cellH - 4, 10)
            ctx.stroke()

            // Text
            if (free) {
              ctx.fillStyle = '#8e6d4f'
              ctx.font = 'bold 22px Georgia, serif'
              ctx.fillText('▲', cX + cellW/2, cY + 32)
              ctx.fillStyle = '#542813'
              ctx.font = 'bold 11px Georgia, serif'
              ctx.fillText('FREE', cX + cellW/2, cY + 54)
              ctx.fillStyle = '#8e6d4f'
              ctx.font = 'bold 22px Georgia, serif'
              ctx.fillText('▼', cX + cellW/2, cY + 76)
            } else {
              ctx.fillStyle = '#542813'
              ctx.font = 'bold 32px Georgia, serif'
              ctx.fillText(String(val), cX + cellW/2, cY + cellH/2 + 11)
            }
          }
        }

        // 5. Draw Footer divider & text
        ctx.strokeStyle = 'rgba(142, 109, 79, 0.25)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(30, 808)
        ctx.lineTo(570, 808)
        ctx.stroke()

        // Text
        ctx.fillStyle = '#8e6d4f'
        ctx.font = 'bold 12px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText('♦ BLACK 75 EDITION', 300, 826)

        // Trigger file download
        const dataUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `carton_${ticket.ticket_number}.png`
        a.click()

        // Log download to localStorage
        const logKey = 'bingo_downloads_log'
        const logEntry = {
          ticketNumber: ticket.ticket_number,
          downloadedAt: new Date().toISOString()
        }
        const existing = JSON.parse(localStorage.getItem(logKey) || '[]')
        existing.push(logEntry)
        localStorage.setItem(logKey, JSON.stringify(existing))

        // Log download to global server database for sync across all network devices
        fetch('/api/log-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        }).catch(() => {})

        setIsGenerating(false)
      }

      // Load watermark logo asynchronously
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.onload = () => {
        drawCard(logoImg)
      }
      logoImg.onerror = () => {
        // Fallback immediately to drawing without watermark logo if loading fails
        drawCard(null)
      }
      logoImg.src = horseWatermark

    } catch (err) {
      alert('Error al generar la imagen del cartón: ' + err.message)
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b031e] via-[#080214] to-[#120530] text-white relative overflow-x-hidden font-sans">
      {/* Premium background radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/5 rounded-full blur-[160px] rotate-12" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-12 flex flex-col min-h-screen justify-between">
        
        {/* Navigation / Header */}
        <header className="flex items-center justify-end mb-8 border-b border-[#221443]/40 pb-5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-black tracking-[0.2em] text-[#7c7297] uppercase">Soporte en línea</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full my-4">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-full px-4 py-1.5 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a78bfa]">Buscador de Boletos</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
              Consulta tu <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Cartón Oficial</span>
            </h1>
            <p className="text-[#7c7297] text-sm md:text-base font-medium">
              Escribe el número de cartón asignado para visualizar tu matriz de juego y descargar tu boleto digital en formato PNG de alta resolución.
            </p>
          </div>

          {searchStatus !== 'no_data' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
              
              {/* Left Column: Search & Controls */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#a78bfa] mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    Ingrese sus datos
                  </h2>

                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          // Reset card preview as soon as user starts typing again
                          if (searchStatus === 'found' || searchStatus === 'not_found') {
                            setFoundTicket(null)
                            setSearchStatus('idle')
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Número de cartón (ej: 34)"
                        className="w-full h-14 bg-[#180c35]/50 border border-[#221443] rounded-xl pl-4 pr-4 text-lg font-black text-white placeholder:text-[#7c7297]/40 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all font-mono tracking-widest shadow-inner"
                        autoFocus
                      />
                    </div>

                    <button
                      onClick={handleSearch}
                      className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-[#0f0729] font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Buscar Cartón
                    </button>
                  </div>
                </div>

                {/* Direct Download Button (Visible only when ticket found) */}
                {searchStatus === 'found' && foundTicket && (
                  <div className="bg-[#0e0524]/40 border border-[#221443]/60 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.2)] animate-slide-in">
                    <div className="flex items-center gap-2.5 text-emerald-400 px-1">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider">¡Listo para descargar!</span>
                    </div>
                    
                    <button
                      onClick={handleDownloadPNG}
                      disabled={isGenerating}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <Download className="w-4 h-4" />
                      {isGenerating ? 'Generando PNG...' : 'Descargar Boleto PNG'}
                    </button>
                  </div>
                )}

                {/* Not Found State */}
                {searchStatus === 'not_found' && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 text-center animate-slide-in">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-sm font-black text-red-400 mb-1">Boleto no encontrado</h3>
                    <p className="text-[#7c7297] text-xs leading-relaxed max-w-xs mx-auto">
                      No registramos el boleto <span className="font-bold text-white font-mono">N° {searchQuery}</span>. Por favor verifique el número impreso.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Visual Card Preview or Instructions */}
              {/* On mobile: only render this column when a card is found (avoids phantom card overlap) */}
              <div className={`lg:col-span-7 flex items-center justify-center ${
                searchStatus === 'found' && foundTicket ? 'min-h-[300px]' : 'hidden lg:flex lg:min-h-[300px]'
              }`}>
                {searchStatus === 'found' && foundTicket ? (
                  <div className="w-full max-w-xs md:max-w-sm animate-bounce-in">
                    <div className="relative group">
                      {/* Ambient hover glow */}
                      <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl group-hover:bg-purple-500/20 transition-all duration-500 pointer-events-none" />
                      
                      <div className="relative transform hover:scale-[1.02] transition-transform duration-500">
                        <BingoCard ticket={foundTicket} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-[#0e0524]/20 border border-dashed border-[#221443] rounded-3xl max-w-sm w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#180c35]/40 border border-[#221443] flex items-center justify-center">
                      <Ticket className="w-7 h-7 text-[#7c7297]/40" />
                    </div>
                    <h3 className="text-sm font-black text-white/80 uppercase tracking-wider">Visualizador Digital</h3>
                    <p className="text-[#7c7297] text-xs mt-2 leading-relaxed">
                      Ingrese un número de cartón válido a la izquierda y presione buscar para ver una vista previa interactiva aquí.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* No data fallback */
            <div className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-2xl my-6">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Cartones no disponibles</h2>
              <p className="text-[#7c7297] text-sm leading-relaxed max-w-sm mx-auto mb-6">
                El organizador aún no ha cargado los cartones oficiales para el sorteo activo. Vuelva a consultar más tarde.
              </p>
              <div className="h-[1px] bg-[#221443] w-full my-5" />
              <p className="text-[10px] text-[#7c7297]/60 font-bold uppercase tracking-widest">
                Servicio Centralizado de Distribución
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-8 border-t border-[#221443]/30 pt-6">
          <p className="text-[#7c7297]/30 text-[9px] font-black uppercase tracking-[0.35em]">
            Solibingo © Todos los derechos reservados • Sistema Modular de Boletas v3.0
          </p>
        </footer>

      </div>
    </div>
  )
}
