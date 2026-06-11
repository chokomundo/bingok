import horseWatermark from '../assets/horse_watermark.png'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']

export default function BingoCard({ ticket }) {
  return (
    <div className="w-full relative rounded-3xl overflow-hidden select-none p-4 flex flex-col justify-between transition-all duration-500 ease-out"
      style={{
        background: 'radial-gradient(circle, #fdfaf5 0%, #ecdcc4 100%)',
        border: '2px solid #8e6d4f',
        boxShadow: '0 15px 40px rgba(84, 40, 19, 0.15)'
      }}>
      
      {/* Import the gorgeous fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Cinzel:wght@400..900&display=swap" rel="stylesheet" />

      {/* Ornate inner border */}
      <div className="absolute inset-2 pointer-events-none rounded-[20px]" 
        style={{ border: '1px dashed rgba(142, 109, 79, 0.4)' }} />

      {/* Decorative vector-like corner dots */}
      <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8e6d4f' }} />
      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8e6d4f' }} />
      <div className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8e6d4f' }} />
      <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8e6d4f' }} />

      {/* ── HEADER PANEL ── */}
      <div className="p-2 mb-2.5 relative flex flex-col justify-center min-h-[72px]">
        {/* Card Number on Top Left */}
        <div className="absolute top-0.5 left-1 font-serif text-[10px] tracking-wider font-bold" style={{ color: '#542813' }}>
          Nº {ticket.ticket_number}
        </div>
        
        <div className="text-center mt-3">
          <h2 className="text-[25px] font-black tracking-[0.08em] uppercase leading-none"
            style={{
              color: '#542813',
              fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
              textShadow: '0.5px 0.5px 0px #fff, 1.5px 1.5px 3px rgba(84, 40, 19, 0.3)'
            }}>
            Bingo
          </h2>
          <h3 className="text-[21px] font-black tracking-[0.06em] uppercase leading-none mt-0.5"
            style={{
              color: '#542813',
              fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
              textShadow: '0.5px 0.5px 0px #fff, 1.5px 1.5px 3px rgba(84, 40, 19, 0.3)'
            }}>
            Chaqueño
          </h3>
          
          <div className="flex items-center justify-center gap-3 mt-1.5">
            <span className="text-[8px] font-serif" style={{ color: '#8e6d4f' }}>✿</span>
            <span className="w-12 h-[0.5px]" style={{ backgroundColor: 'rgba(142, 109, 79, 0.4)' }} />
            <span className="text-[9px] font-black tracking-[0.25em] font-serif uppercase" style={{ color: '#542813' }}>3 × 15</span>
            <span className="w-12 h-[0.5px]" style={{ backgroundColor: 'rgba(142, 109, 79, 0.4)' }} />
            <span className="text-[8px] font-serif" style={{ color: '#8e6d4f' }}>✿</span>
          </div>
        </div>
      </div>

      {/* ── BINGO LETTER HEADERS ── */}
      <div className="mx-0.5 mb-1.5 py-0.5 border-y"
        style={{
          borderColor: 'rgba(142, 109, 79, 0.3)',
          backgroundColor: 'rgba(253, 250, 245, 0.4)'
        }}>
        <div className="grid grid-cols-5 relative">
          {BINGO_LETTERS.map((l) => (
            <div key={l} className="flex items-center justify-center font-black text-lg font-serif"
              style={{
                color: '#542813',
                fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif"
              }}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* ── GRID SECTION ── */}
      <div className="mx-0.5 mb-1.5 relative p-0.5">
        {/* Rearing horse watermark behind numbers */}
        <img src={horseWatermark} alt=""
          className="absolute inset-0 w-[85%] h-[85%] m-auto top-0 bottom-0 left-0 right-0 object-contain pointer-events-none"
          style={{ opacity: 0.16 }} />
        
        <div className="relative grid grid-cols-5 gap-1.5">
          {ticket.matrix.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const free = cell === 0
              return (
                <div key={`${rIdx}-${cIdx}`}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl relative overflow-hidden shadow-sm border transition-all duration-300"
                  style={{
                    background: free ? 'rgba(253, 250, 245, 0.65)' : 'rgba(253, 250, 245, 0.82)',
                    borderColor: free ? '#8e6d4f' : '#c8b9a6',
                    boxShadow: '0 2px 4px rgba(84, 40, 19, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.9)'
                  }}>
                  
                  {/* Outer nested thin border */}
                  <div className="absolute inset-[1.5px] rounded-[10px] pointer-events-none"
                    style={{ border: '1px solid rgba(142, 109, 79, 0.15)' }} />

                  {free ? (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] leading-none" style={{ color: '#8e6d4f' }}>▲</span>
                      <span className="font-black text-[6.5px] tracking-widest leading-none my-0.5 uppercase"
                        style={{ color: '#542813', fontFamily: "'Cinzel', Georgia, serif" }}>
                        Free
                      </span>
                      <span className="text-[10px] leading-none" style={{ color: '#8e6d4f' }}>▼</span>
                    </div>
                  ) : (
                    <span className="font-bold text-lg leading-none"
                      style={{
                        color: '#542813',
                        fontFamily: "'Playfair Display', Georgia, serif",
                        textShadow: '0.5px 0.5px 0px rgba(255, 255, 255, 0.8)'
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
      <div className="flex justify-center items-center mt-2.5 pt-2 px-1 text-[9px]"
        style={{
          borderTop: '1px solid rgba(142, 109, 79, 0.25)',
          color: '#8e6d4f'
        }}>
        <div className="flex items-center gap-1">
          <span className="font-bold tracking-[0.18em] uppercase font-serif" 
            style={{ 
              color: '#8e6d4f',
              fontFamily: "'Cinzel', Georgia, serif" 
            }}>
            ♦ Black 75 Edition
          </span>
        </div>
      </div>

    </div>
  )
}

export { BINGO_LETTERS }
