import bolilloLogo from '../assets/bolillo_logo.jpg'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']

export default function BingoCard({ ticket }) {
  const formattedTicketNum = String(ticket?.ticket_number || 1).padStart(6, '0')
  const ticketValue = ticket?.price || '20 BS'

  return (
    <div className="w-full relative rounded-2xl overflow-hidden select-none p-3.5 flex flex-col justify-between transition-all duration-500 ease-out border-4 border-[#C5A052] shadow-2xl"
      style={{
        background: '#FAF6EF',
        boxShadow: '0 15px 40px rgba(84, 40, 19, 0.2), inset 0 0 15px rgba(197, 160, 82, 0.15)'
      }}>
      
      {/* Import fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Cinzel:wght@600;700;800;900&display=swap" rel="stylesheet" />

      {/* Ornate outer thin border */}
      <div className="absolute inset-1.5 pointer-events-none rounded-xl" 
        style={{ border: '1px solid #C5A052' }} />

      {/* Ornate corner filigree flourishes */}
      <div className="absolute top-2 left-2 text-[#C5A052] text-xs pointer-events-none font-serif leading-none">❧</div>
      <div className="absolute top-2 right-2 text-[#C5A052] text-xs pointer-events-none font-serif leading-none rotate-90">❧</div>
      <div className="absolute bottom-2 left-2 text-[#C5A052] text-xs pointer-events-none font-serif leading-none -rotate-90">❧</div>
      <div className="absolute bottom-2 right-2 text-[#C5A052] text-xs pointer-events-none font-serif leading-none rotate-180">❧</div>

      {/* ── TOP HEADER SECTION ── */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1 relative z-10">
        
        {/* Left: Official Logo */}
        <div className="w-20 md:w-24 shrink-0 flex items-center justify-center">
          <img src={bolilloLogo} alt="Bolillo de la Suerte" className="w-full h-auto object-contain drop-shadow-md" />
        </div>

        {/* Middle: TABLA # Ribbon & Padded Number */}
        <div className="flex flex-col items-center justify-center flex-1">
          {/* Burgundy Ribbon */}
          <div className="bg-[#8B1A1A] text-white px-4 py-0.5 rounded-sm font-black text-[11px] md:text-xs tracking-widest uppercase shadow-sm relative font-serif"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 92% 100%, 8% 100%)',
              fontFamily: "'Cinzel', Georgia, serif"
            }}>
            CARTÓN #
          </div>
          {/* 6-Digit Number */}
          <span className="text-2xl md:text-3xl font-black text-[#111111] tracking-tight leading-none mt-1 font-serif"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {formattedTicketNum}
          </span>
        </div>

        {/* Right: VALOR & Price */}
        <div className="flex flex-col items-center justify-center shrink-0 min-w-[70px]">
          <span className="text-[10px] md:text-[11px] font-black text-[#8B1A1A] tracking-wider uppercase font-serif"
            style={{ fontFamily: "'Cinzel', Georgia, serif" }}>
            VALOR:
          </span>
          <div className="w-full h-[1px] bg-[#C5A052] my-0.5" />
          <span className="text-base md:text-lg font-black text-[#111111] leading-none font-serif"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {ticketValue}
          </span>
          <div className="w-full h-[1px] bg-[#C5A052] my-0.5" />
        </div>
      </div>

      {/* ── 5x5 GRID CONTAINER (Double Gold Frame) ── */}
      <div className="rounded-md border-2 border-[#C5A052] p-[2px] bg-[#C5A052]/20 relative shadow-md">
        
        {/* BINGO Column Headers Row */}
        <div className="grid grid-cols-5 bg-[#8B1A1A] text-center border-b-2 border-[#C5A052] rounded-t-sm">
          {BINGO_LETTERS.map((l, i) => (
            <div key={l} 
              className={`py-1 md:py-1.5 font-black text-xl md:text-2xl tracking-wider text-[#E2C070] drop-shadow-sm font-serif ${i < 4 ? 'border-r border-[#C5A052]/40' : ''}`}
              style={{ fontFamily: "'Cinzel', Georgia, serif" }}>
              {l}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-5 bg-[#C5A052]/40 gap-[1px]">
          {ticket?.matrix?.flatMap((row, rIdx) =>
            row.map((cell, cIdx) => {
              const free = cell === 0
              return (
                <div key={`${rIdx}-${cIdx}`}
                  className={`aspect-square flex items-center justify-center relative overflow-hidden transition-colors ${
                    free 
                      ? 'bg-[#F5EEE3] border-2 border-[#C5A052]' 
                      : 'bg-[#FFFDF9] hover:bg-[#FDF8F0]'
                  }`}>
                  
                  {free ? (
                    <div className="w-full h-full p-1 flex items-center justify-center">
                      <div className="w-full h-full rounded-full border-2 border-[#C5A052] bg-[#8B1A1A] flex items-center justify-center shadow-inner">
                        <span className="text-[#E2C070] font-black text-xs md:text-sm font-serif drop-shadow" style={{ fontFamily: "'Cinzel', Georgia, serif" }}>
                          B
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="font-black text-lg md:text-xl lg:text-2xl text-[#111111] leading-none font-serif"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {cell}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── FOOTER RIBBON ── */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-[#C5A052] text-xs font-serif">❖</span>
        <div className="bg-[#8B1A1A] text-white px-5 py-0.5 rounded-sm font-black text-[10px] md:text-[11px] tracking-widest uppercase shadow-sm font-serif"
          style={{
            clipPath: 'polygon(6% 0, 94% 0, 100% 100%, 0 100%)',
            fontFamily: "'Cinzel', Georgia, serif"
          }}>
          ¡BUENA SUERTE!
        </div>
        <span className="text-[#C5A052] text-xs font-serif">❖</span>
      </div>

    </div>
  )
}

export { BINGO_LETTERS }
