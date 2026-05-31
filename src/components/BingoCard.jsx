import solibingoLogo from '../assets/solibingo_hero.png'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']

export default function BingoCard({ ticket }) {
  return (
    <div className="w-full relative rounded-3xl overflow-hidden select-none p-4 flex flex-col justify-between transition-all duration-500 ease-out"
      style={{
        background: 'radial-gradient(circle at top, #140d24 0%, #08050e 100%)',
        border: '3px solid #6b21a8',
        boxShadow: '0 15px 45px rgba(139, 92, 246, 0.25)'
      }}>
      
      {/* Import the gorgeous fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Cinzel:wght@400..900&display=swap" rel="stylesheet" />

      {/* Decorative vector-like corner dots */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(147, 51, 234, 0.6)' }} />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(147, 51, 234, 0.6)' }} />
      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(147, 51, 234, 0.6)' }} />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(147, 51, 234, 0.6)' }} />

      {/* ── HEADER PANEL ── */}
      <div className="rounded-2xl p-2.5 mb-3 relative overflow-hidden shadow-inner flex flex-col justify-center min-h-[66px]"
        style={{
          border: '1px solid rgba(88, 28, 135, 0.6)',
          backgroundColor: 'rgba(17, 9, 30, 0.8)'
        }}>
        {/* Card Number on Top Left */}
        <div className="absolute top-1.5 left-2.5 font-black font-mono text-[9px] tracking-wider" style={{ color: '#a855f7' }}>
          N° {ticket.ticket_number}
        </div>

        {/* Subtle decorative glowing line */}
        <div className="absolute top-0 left-0 right-0 h-[1px]" 
          style={{ 
            background: 'linear-gradient(to right, transparent, #a855f7, transparent)', 
            opacity: 0.5 
          }} />
        
        <div className="text-center">
          <h2 className="text-[25px] font-black tracking-[0.08em] uppercase"
            style={{
              color: '#efeaf6',
              fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
              textShadow: '0 0 10px rgba(168,85,247,0.4), 0 3px 5px rgba(0,0,0,0.9)'
            }}>
            Bingo Black
          </h2>
          
          <div className="flex items-center justify-center gap-3 mt-1.5">
            {/* Elegant curly vector ornaments */}
            <span className="text-xs font-serif" style={{ color: 'rgba(126, 34, 206, 0.8)' }}>❀</span>
            <span className="w-12 h-[1px]" style={{ backgroundColor: 'rgba(88, 28, 135, 0.6)' }} />
            <span className="text-[11px] font-black tracking-[0.25em] font-serif uppercase" style={{ color: '#c084fc' }}>3 × 15</span>
            <span className="w-12 h-[1px]" style={{ backgroundColor: 'rgba(88, 28, 135, 0.6)' }} />
            <span className="text-xs font-serif" style={{ color: 'rgba(126, 34, 206, 0.8)' }}>❀</span>
          </div>
        </div>
      </div>

      {/* ── BINGO LETTER HEADERS ── */}
      <div className="mx-0.5 rounded-xl overflow-hidden shadow-md mb-2"
        style={{
          border: '1px solid rgba(88, 28, 135, 0.5)',
          backgroundColor: '#201c27'
        }}>
        <div className="grid grid-cols-5 py-1 px-1.5 relative">
          {BINGO_LETTERS.map((l, i) => (
            <div key={l} className="flex items-center justify-center font-black text-xl py-0.5 font-serif"
              style={{
                color: '#d8b4fe',
                fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
                textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                borderLeft: i > 0 ? '1px solid rgba(59, 7, 105, 0.4)' : 'none'
              }}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* ── GRID SECTION ── */}
      <div className="mx-0.5 mb-1.5 rounded-2xl overflow-hidden p-1.5 relative shadow-inner"
        style={{
          border: '1px solid rgba(88, 28, 135, 0.5)',
          backgroundColor: '#09070f'
        }}>
        {/* Soft watermark behind numbers */}
        <img src={solibingoLogo} alt=""
          className="absolute inset-0 w-[78%] h-auto m-auto top-0 bottom-0 left-0 right-0 object-contain pointer-events-none"
          style={{ opacity: 0.08 }} />
        
        <div className="relative grid grid-cols-5 gap-2">
          {ticket.matrix.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const free = cell === 0
              return (
                <div key={`${rIdx}-${cIdx}`}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl relative overflow-hidden shadow-md"
                  style={{
                    background: free ? 'radial-gradient(circle, #25123d 0%, #11071c 100%)' : 'radial-gradient(circle, #221d2a 0%, #15121b 100%)',
                    border: free ? '1.5px solid #a855f7' : '1.5px solid #4a2176',
                    boxShadow: free ? '0 0 10px rgba(168,85,247,0.3) inset' : 'none'
                  }}>
                  
                  {/* Outer nested thin border */}
                  <div className="absolute inset-[1.5px] rounded-[10px] pointer-events-none"
                    style={{ border: '1px solid rgba(59, 7, 105, 0.3)' }} />

                  {free ? (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-sm leading-none" style={{ color: '#d8b4fe' }}>▲</span>
                      <span className="font-black text-[7px] tracking-widest leading-none my-0.5 uppercase"
                        style={{ color: '#d8b4fe', fontFamily: "'Cinzel', Georgia, serif" }}>
                        Free
                      </span>
                      <span className="text-sm leading-none" style={{ color: '#d8b4fe' }}>▼</span>
                    </div>
                  ) : (
                    <span className="font-bold text-lg leading-none"
                      style={{
                        color: '#efeaf6',
                        fontFamily: "'Playfair Display', Georgia, serif",
                        textShadow: '1px 1px 3px rgba(0,0,0,0.8), -1px -1px 3px rgba(0,0,0,0.8)'
                      }}>
                      {cell}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── FOOTER ROW ── */}
      <div className="flex justify-between items-center mt-2.5 pt-2.5 px-1 text-[9px]"
        style={{
          borderTop: '1px solid rgba(59, 7, 105, 0.6)',
          color: '#7c7297'
        }}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#9333ea' }} />
          <span className="font-bold tracking-[0.18em] uppercase font-serif" 
            style={{ 
              color: 'rgba(168, 85, 247, 0.8)',
              fontFamily: "'Cinzel', Georgia, serif" 
            }}>
            Black 75 Edition
          </span>
        </div>
      </div>

    </div>
  )
}

export { BINGO_LETTERS }
