import { useState, useCallback, useEffect } from 'react'
import { Search, Download, Sparkles, AlertCircle, ArrowLeft, Ticket, CheckCircle2 } from 'lucide-react'
import horseWatermark from './assets/horse_watermark.png'
import bolilloLogo from './assets/bolillo_logo.jpg'
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

      const drawCard = (logoImgLoaded = null, bolilloLogoLoaded = null) => {
        const formattedNum = String(ticket.ticket_number || 1).padStart(6, '0')
        const valText = ticket.price || '20 BS'

        // 1. Draw Vintage Paper Background
        ctx.fillStyle = '#FAF6EF'
        ctx.fillRect(0, 0, 600, 850)

        // Outer Gold Border
        ctx.strokeStyle = '#C5A052'
        ctx.lineWidth = 6
        drawRoundedRect(ctx, 12, 12, 576, 826, 16)
        ctx.stroke()

        // Inner Thin Gold Border
        ctx.strokeStyle = '#C5A052'
        ctx.lineWidth = 1.5
        drawRoundedRect(ctx, 18, 18, 564, 814, 12)
        ctx.stroke()

        // Corner Filigree Flourishes
        ctx.fillStyle = '#C5A052'
        ctx.font = '20px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText('❧', 30, 36)
        ctx.fillText('❧', 570, 36)
        ctx.fillText('❧', 30, 824)
        ctx.fillText('❧', 570, 824)

        // 2. HEADER PANEL
        // Left: Official Logo
        if (bolilloLogoLoaded) {
          ctx.drawImage(bolilloLogoLoaded, 28, 30, 110, 100)
        } else {
          ctx.fillStyle = '#8B1A1A'
          ctx.font = 'bold 20px Georgia, serif'
          ctx.textAlign = 'left'
          ctx.fillText('BOLILLO', 32, 75)
        }

        // Middle: TABLA # Ribbon & Padded Number
        ctx.fillStyle = '#8B1A1A'
        ctx.beginPath()
        ctx.moveTo(210, 32)
        ctx.lineTo(390, 32)
        ctx.lineTo(375, 60)
        ctx.lineTo(225, 60)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 15px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText('CARTÓN #', 300, 52)

        ctx.fillStyle = '#111111'
        ctx.font = 'bold 42px Georgia, serif'
        ctx.fillText(formattedNum, 300, 112)

        // Right: VALOR & Price
        ctx.fillStyle = '#8B1A1A'
        ctx.font = 'bold 15px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText('VALOR:', 490, 48)

        ctx.strokeStyle = '#C5A052'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(435, 56)
        ctx.lineTo(545, 56)
        ctx.moveTo(435, 105)
        ctx.lineTo(545, 105)
        ctx.stroke()

        ctx.fillStyle = '#111111'
        ctx.font = 'bold 26px Georgia, serif'
        ctx.fillText(valText, 490, 92)

        // 3. 5x5 GRID BOX (Double Gold Frame)
        const gridX = 26
        const gridY = 145
        const gridW = 548
        const colW = gridW / 5
        const headerH = 50
        const cellH = 96

        // Outer Frame
        ctx.strokeStyle = '#C5A052'
        ctx.lineWidth = 3
        drawRoundedRect(ctx, gridX, gridY, gridW, headerH + cellH * 5, 8)
        ctx.stroke()

        // Headers (B I N G O) Background
        ctx.fillStyle = '#8B1A1A'
        ctx.fillRect(gridX, gridY, gridW, headerH)

        // Headers Divider Line
        ctx.strokeStyle = '#C5A052'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(gridX, gridY + headerH)
        ctx.lineTo(gridX + gridW, gridY + headerH)
        ctx.stroke()

        const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']
        BINGO_LETTERS.forEach((l, i) => {
          ctx.fillStyle = '#E2C070'
          ctx.font = 'bold 32px Georgia, serif'
          ctx.textAlign = 'center'
          ctx.fillText(l, gridX + i * colW + colW / 2, gridY + 36)

          if (i < 4) {
            ctx.strokeStyle = 'rgba(197, 160, 82, 0.4)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(gridX + (i + 1) * colW, gridY)
            ctx.lineTo(gridX + (i + 1) * colW, gridY + headerH)
            ctx.stroke()
          }
        })

        // Grid Cells Background
        const cellsStartY = gridY + headerH
        ctx.fillStyle = 'rgba(197, 160, 82, 0.4)'
        ctx.fillRect(gridX, cellsStartY, gridW, cellH * 5)

        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const val = ticket.matrix[r][c]
            const cX = gridX + c * colW
            const cY = cellsStartY + r * cellH
            const free = val === 0

            // Fill & Border
            ctx.fillStyle = free ? '#F5EEE3' : '#FFFDF9'
            ctx.fillRect(cX + 1, cY + 1, colW - 2, cellH - 2)

            ctx.strokeStyle = '#C5A052'
            ctx.lineWidth = 1
            ctx.strokeRect(cX, cY, colW, cellH)

            if (free) {
              // Circular Red Medallion with Gold "B"
              const rad = Math.min(colW, cellH) * 0.38
              const midX = cX + colW / 2
              const midY = cY + cellH / 2

              ctx.beginPath()
              ctx.arc(midX, midY, rad, 0, Math.PI * 2)
              ctx.fillStyle = '#8B1A1A'
              ctx.fill()
              ctx.lineWidth = 3
              ctx.strokeStyle = '#C5A052'
              ctx.stroke()

              ctx.fillStyle = '#E2C070'
              ctx.font = 'bold 24px Georgia, serif'
              ctx.textAlign = 'center'
              ctx.fillText('B', midX, midY + 8)
            } else {
              ctx.fillStyle = '#111111'
              ctx.font = 'bold 36px Georgia, serif'
              ctx.textAlign = 'center'
              ctx.fillText(String(val), cX + colW / 2, cY + cellH / 2 + 12)
            }
          }
        }

        // 4. FOOTER RIBBON
        const footY = gridY + headerH + cellH * 5 + 18

        ctx.fillStyle = '#C5A052'
        ctx.font = '16px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText('❖', 180, footY + 16)
        ctx.fillText('❖', 420, footY + 16)

        ctx.fillStyle = '#8B1A1A'
        ctx.beginPath()
        ctx.moveTo(210, footY)
        ctx.lineTo(390, footY)
        ctx.lineTo(405, footY + 24)
        ctx.lineTo(195, footY + 24)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 13px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText('¡BUENA SUERTE!', 300, footY + 17)

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

      // Load both images asynchronously
      let bolilloLogoLoaded = null
      let logoImgResult = null
      let loadedCount = 0
      const totalLoads = 2
      
      const tryDraw = () => {
        loadedCount++
        if (loadedCount >= totalLoads) {
          drawCard(logoImgResult, bolilloLogoLoaded)
        }
      }
      
      const bolilloImg = new Image()
      bolilloImg.crossOrigin = 'anonymous'
      bolilloImg.onload = () => { bolilloLogoLoaded = bolilloImg; tryDraw() }
      bolilloImg.onerror = () => tryDraw()
      bolilloImg.src = bolilloLogo
      
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.onload = () => { logoImgResult = logoImg; tryDraw() }
      logoImg.onerror = () => tryDraw()
      logoImg.src = horseWatermark

    } catch (err) {
      alert('Error al generar la imagen del cartón: ' + err.message)
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a0a] via-[#0d0808] to-[#1a0e0e] text-white relative overflow-x-hidden font-sans">
      {/* Premium background radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#8B1A1A]/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#C5A052]/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#8B1A1A]/5 rounded-full blur-[160px] rotate-12" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-12 flex flex-col min-h-screen justify-between">
        
        {/* Navigation / Header */}
        <header className="flex items-center justify-end mb-8 border-b border-[#3d1f1f]/40 pb-5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-black tracking-[0.2em] text-[#8a7262] uppercase">Soporte en línea</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full my-4">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#8B1A1A]/10 border border-[#8B1A1A]/20 rounded-full px-4 py-1.5 mb-4 shadow-[0_0_15px_rgba(139,26,26,0.1)]">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A052] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C5A052]">Buscador de Boletos</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
              Consulta tu <span className="bg-gradient-to-r from-[#C5A052] via-[#d4b366] to-[#a8863e] bg-clip-text text-transparent">Cartón Oficial</span>
            </h1>
            <p className="text-[#8a7262] text-sm md:text-base font-medium">
              Escribe el número de cartón asignado para visualizar tu matriz de juego y descargar tu boleto digital en formato PNG de alta resolución.
            </p>
          </div>

          {searchStatus !== 'no_data' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
              
              {/* Left Column: Search & Controls */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="bg-[#1a0e0e]/60 backdrop-blur-xl border border-[#3d1f1f] rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#C5A052] mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#C5A052]" />
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
                        className="w-full h-14 bg-[#2d1515]/50 border border-[#3d1f1f] rounded-xl pl-4 pr-4 text-lg font-black text-white placeholder:text-[#8a7262]/40 focus:outline-none focus:ring-2 focus:ring-[#C5A052]/30 focus:border-[#C5A052]/50 transition-all font-mono tracking-widest shadow-inner"
                        autoFocus
                      />
                    </div>

                    <button
                      onClick={handleSearch}
                      className="w-full h-12 bg-gradient-to-r from-[#C5A052] to-[#d4b366] hover:from-[#d4b366] hover:to-[#C5A052] text-[#0f0a0a] font-black text-sm rounded-xl shadow-lg shadow-[#C5A052]/20 hover:shadow-[#C5A052]/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Buscar Cartón
                    </button>
                  </div>
                </div>

                {/* Direct Download Button (Visible only when ticket found) */}
                {searchStatus === 'found' && foundTicket && (
                  <div className="bg-[#1a0e0e]/40 border border-[#3d1f1f]/60 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.2)] animate-slide-in">
                    <div className="flex items-center gap-2.5 text-emerald-400 px-1">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider">¡Listo para descargar!</span>
                    </div>
                    
                    <button
                      onClick={handleDownloadPNG}
                      disabled={isGenerating}
                      className="w-full h-12 bg-gradient-to-r from-[#8B1A1A] to-[#b22222] hover:from-[#b22222] hover:to-[#8B1A1A] text-white font-black text-xs rounded-xl shadow-lg shadow-[#8B1A1A]/30 hover:shadow-[#8B1A1A]/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
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
                    <p className="text-[#8a7262] text-xs leading-relaxed max-w-xs mx-auto">
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
                      <div className="absolute inset-0 bg-[#8B1A1A]/10 rounded-2xl blur-xl group-hover:bg-[#8B1A1A]/20 transition-all duration-500 pointer-events-none" />
                      
                      <div className="relative transform hover:scale-[1.02] transition-transform duration-500">
                        <BingoCard ticket={foundTicket} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-[#1a0e0e]/20 border border-dashed border-[#3d1f1f] rounded-3xl max-w-sm w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#2d1515]/40 border border-[#3d1f1f] flex items-center justify-center">
                      <Ticket className="w-7 h-7 text-[#8a7262]/40" />
                    </div>
                    <h3 className="text-sm font-black text-white/80 uppercase tracking-wider">Visualizador Digital</h3>
                    <p className="text-[#8a7262] text-xs mt-2 leading-relaxed">
                      Ingrese un número de cartón válido a la izquierda y presione buscar para ver una vista previa interactiva aquí.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* No data fallback */
            <div className="bg-[#1a0e0e]/60 backdrop-blur-xl border border-[#3d1f1f] rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-2xl my-6">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#C5A052]/10 border border-[#C5A052]/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-[#C5A052]" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Cartones no disponibles</h2>
              <p className="text-[#8a7262] text-sm leading-relaxed max-w-sm mx-auto mb-6">
                El organizador aún no ha cargado los cartones oficiales para el sorteo activo. Vuelva a consultar más tarde.
              </p>
              <div className="h-[1px] bg-[#3d1f1f] w-full my-5" />
              <p className="text-[10px] text-[#8a7262]/60 font-bold uppercase tracking-widest">
                Servicio Centralizado de Distribución
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-8 border-t border-[#3d1f1f]/30 pt-6">
          <p className="text-[#8a7262]/30 text-[9px] font-black uppercase tracking-[0.35em]">
            Bolillo de la Suerte © Todos los derechos reservados • Sistema Modular de Boletas v3.0
          </p>
        </footer>

      </div>
    </div>
  )
}
