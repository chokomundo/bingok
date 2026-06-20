import comicKids from '../assets/comic_kids.png'

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']

export default function BingoCard({ ticket }) {
  return (
    <div className="w-full relative rounded-[32px] overflow-visible select-none p-5 flex flex-col justify-between transition-all duration-500 ease-out"
      style={{
        backgroundColor: '#e6f7ff',
        backgroundImage: 'linear-gradient(135deg, #e6f7ff 0%, #bae6fd 100%)',
        border: '4.5px solid #081a36',
        boxShadow: '6px 6px 0px #081a36'
      }}>
      
      {/* Import the gorgeous comic fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Comic+Neue:wght@700;900&family=Bangers&display=swap" rel="stylesheet" />

      {/* Sketchy inner border */}
      <div className="absolute inset-1.5 border-2 border-[#081a36] rounded-[26px] pointer-events-none opacity-90" />

      {/* Halftone dots in top-right and bottom-left corners */}
      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#081a36 20%, transparent 20%)',
          backgroundSize: '6px 6px',
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
        }} />
      <div className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#081a36 20%, transparent 20%)',
          backgroundSize: '6px 6px',
          clipPath: 'polygon(0 100%, 0 0, 100% 100%)'
        }} />

      {/* ── HEADER PANEL ── */}
      <div className="relative flex flex-col pt-1 pb-2">
        {/* Card Number on Top Left */}
        <div className="absolute top-0.5 left-1 font-['Comic_Neue'] text-sm tracking-wider font-extrabold text-[#081a36] select-none">
          Nº {ticket.ticket_number}
        </div>

        {/* KAPOW! burst on Top Right */}
        <div className="absolute -top-3.5 -right-3.5 w-16 h-16 rotate-12 drop-shadow-[2px_3px_0px_rgba(8,26,54,1)]">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50,5 60,30 85,20 70,45 95,55 68,65 75,90 50,75 25,90 32,65 5,55 30,45 15,20 40,30" fill="#facc15" stroke="#081a36" strokeWidth="4" strokeLinejoin="miter" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-['Luckiest_Guy'] text-[10px] text-red-600 uppercase tracking-tighter select-none font-bold" style={{ transform: 'rotate(-5deg)' }}>
            KAPOW!
          </span>
        </div>
        
        {/* Main Title speech bubble */}
        <div className="relative mx-auto mt-5 mb-2 px-5 py-2.5 bg-white border-[3.5px] border-[#081a36] rounded-[24px] shadow-[4px_4px_0px_#081a36] flex flex-col items-center justify-center w-[92%] max-w-[280px]"
          style={{ transform: 'rotate(-1.5deg)' }}>
          {/* Speech bubble tail */}
          <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-r-[3.5px] border-b-[3.5px] border-[#081a36]" style={{ transform: 'rotate(45deg)' }} />
          
          <h2 className="font-['Luckiest_Guy'] text-3xl text-center leading-none tracking-wider select-none"
            style={{
              backgroundImage: 'linear-gradient(to bottom, #fde047 0%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(2px 2px 0px #081a36)'
            }}>
            BINGO
          </h2>
          <h3 className="font-['Luckiest_Guy'] text-2xl text-center leading-none tracking-wider select-none mt-0.5"
            style={{
              backgroundImage: 'linear-gradient(to bottom, #fde047 0%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(2.5px 2.5px 0px #081a36)'
            }}>
            FAMILIAR
          </h3>
        </div>

        {/* Small "¡DALE!" bubble below title bubble */}
        <div className="absolute bottom-[-10px] right-[25%] rotate-[8deg] bg-white border-2 border-[#081a36] rounded-full px-2 py-0.5 shadow-[1.5px_1.5px_0px_#081a36] z-10">
          <span className="font-['Luckiest_Guy'] text-[8.5px] tracking-wide text-[#081a36]">¡DALE!</span>
        </div>
      </div>

      {/* ── MIDDLE ROW (ILLUSTRATIONS & DETAILS) ── */}
      <div className="flex items-center justify-between px-1.5 my-2 gap-2 min-h-[64px]">
        {/* Left: Kids shouting BINGO */}
        <div className="relative w-[48%] flex flex-col items-center">
          <img src={comicKids} alt="Kids Shouting Bingo" className="w-full max-h-[56px] object-contain drop-shadow-[1px_2px_0px_rgba(8,26,54,0.15)]" />
          <div className="absolute bottom-[-8px] right-0 rotate-[-5deg] bg-white border-2 border-[#081a36] rounded-md px-1.5 py-0 shadow-[1.5px_1.5px_0px_#081a36]">
            <span className="font-['Luckiest_Guy'] text-[7.5px] text-[#081a36] tracking-tight">¡BINGO!</span>
          </div>
        </div>

        {/* Right: Info & flowers */}
        <div className="w-[52%] flex flex-col gap-1.5 justify-center pl-1">
          {/* Row 1: Comic + 3x15 + Dice */}
          <div className="flex items-center justify-center gap-1.5">
            {/* Comic Book SVG */}
            <svg viewBox="0 0 100 100" className="w-6 h-6 shrink-0 drop-shadow-[1px_1px_0px_#081a36]">
              <path d="M10,80 Q25,85 50,80 Q75,85 90,80 L90,20 Q75,25 50,20 Q25,25 10,20 Z" fill="#fff" stroke="#081a36" strokeWidth="4" />
              <path d="M8,82 Q25,87 50,82 Q75,87 92,82 L92,18 Q75,23 50,18 Q25,23 8,18 Z" fill="#3b82f6" stroke="#081a36" strokeWidth="4.5" strokeLinejoin="round" />
              <line x1="50" y1="18" x2="50" y2="82" stroke="#081a36" strokeWidth="4" />
              <path d="M20,35 H40 M20,50 H40 M20,65 H40 M60,35 H80 M60,50 H80 M60,65 H80" stroke="#081a36" strokeWidth="3.5" strokeLinecap="round" />
            </svg>

            {/* "3x15" Text */}
            <span className="font-['Luckiest_Guy'] text-sm text-[#081a36] tracking-wide select-none">
              3x15
            </span>

            {/* Dice SVG */}
            <svg viewBox="0 0 120 70" className="w-9 h-5 shrink-0 drop-shadow-[1px_1px_0px_#081a36]">
              <g transform="translate(10, 10) rotate(-6)">
                <rect x="0" y="0" width="40" height="40" rx="8" ry="8" fill="#fff" stroke="#081a36" strokeWidth="4.5" />
                <circle cx="10" cy="10" r="3.5" fill="#081a36" />
                <circle cx="30" cy="10" r="3.5" fill="#081a36" />
                <circle cx="20" cy="20" r="3.5" fill="#081a36" />
                <circle cx="10" cy="30" r="3.5" fill="#081a36" />
                <circle cx="30" cy="30" r="3.5" fill="#081a36" />
              </g>
              <g transform="translate(68, 12) rotate(8)">
                <rect x="0" y="0" width="40" height="40" rx="8" ry="8" fill="#fff" stroke="#081a36" strokeWidth="4.5" />
                <circle cx="10" cy="10" r="3.5" fill="#081a36" />
                <circle cx="20" cy="20" r="3.5" fill="#081a36" />
                <circle cx="30" cy="30" r="3.5" fill="#081a36" />
              </g>
            </svg>
          </div>

          {/* Row 2: Pink flower + "FLOWER" + Orange flower */}
          <div className="flex items-center justify-center gap-1">
            {/* Flower Pink */}
            <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 drop-shadow-[1px_1px_0px_#081a36]">
              <g fill="#ec4899" stroke="#081a36" strokeWidth="6">
                <circle cx="50" cy="25" r="18" />
                <circle cx="74" cy="42" r="18" />
                <circle cx="65" cy="70" r="18" />
                <circle cx="35" cy="70" r="18" />
                <circle cx="26" cy="42" r="18" />
              </g>
              <circle cx="50" cy="50" r="14" fill="#facc15" stroke="#081a36" strokeWidth="6" />
            </svg>

            {/* FLOWER Text */}
            <span className="font-['Luckiest_Guy'] text-[11px] text-[#081a36] tracking-wide select-none">
              FLOWER
            </span>

            {/* Flower Orange */}
            <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 drop-shadow-[1px_1px_0px_#081a36]">
              <g fill="#f97316" stroke="#081a36" strokeWidth="6">
                <circle cx="50" cy="25" r="18" />
                <circle cx="74" cy="42" r="18" />
                <circle cx="65" cy="70" r="18" />
                <circle cx="35" cy="70" r="18" />
                <circle cx="26" cy="42" r="18" />
              </g>
              <circle cx="50" cy="50" r="14" fill="#facc15" stroke="#081a36" strokeWidth="6" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── BINGO LETTER HEADERS ── */}
      <div className="mx-0.5 mb-2 py-1.5 border-y-[3px] border-[#081a36] bg-[#dbeafe]/30">
        <div className="grid grid-cols-5">
          {BINGO_LETTERS.map((l) => (
            <div key={l} className="flex items-center justify-center font-['Luckiest_Guy'] text-3xl select-none"
              style={{
                backgroundImage: 'linear-gradient(to bottom, #bae6fd 0%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(2px 2px 0px #081a36)'
              }}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* ── GRID SECTION ── */}
      <div className="mx-0.5 mb-2 relative p-0.5">
        {/* Small "¡DALE!" bubble pointing to cell 2nd row, 1st col */}
        <div className="absolute left-[-14px] top-[26%] -translate-y-1/2 rotate-[-12deg] bg-white border-2 border-[#081a36] rounded-full px-1.5 py-0 shadow-[1.5px_1.5px_0px_#081a36] z-20">
          <span className="font-['Luckiest_Guy'] text-[7.5px] text-[#081a36] tracking-tight">¡DALE!</span>
          <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white border-r-2 border-t-2 border-[#081a36]" style={{ transform: 'rotate(45deg)' }} />
        </div>

        {/* Small "¡CÁNTALO!" bubble pointing to 4th row, 5th col */}
        <div className="absolute right-[-14px] bottom-[26%] translate-y-1/2 rotate-[12deg] bg-white border-2 border-[#081a36] rounded-full px-1.5 py-0 shadow-[1.5px_1.5px_0px_#081a36] z-20">
          <span className="font-['Luckiest_Guy'] text-[7.5px] text-[#081a36] tracking-tight">¡CÁNTALO!</span>
          <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white border-l-2 border-b-2 border-[#081a36]" style={{ transform: 'rotate(45deg)' }} />
        </div>

        <div className="relative grid grid-cols-5 gap-1.5">
          {ticket.matrix.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const free = cell === 0
              return (
                <div key={`${rIdx}-${cIdx}`}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl relative overflow-visible border-[3px] border-[#081a36] transition-all duration-300"
                  style={{
                    backgroundImage: 'linear-gradient(to bottom, #f0f9ff 0%, #bae6fd 100%)',
                    boxShadow: '0px 3.5px 0px #081a36'
                  }}>
                  
                  {free ? (
                    <div className="absolute inset-0 flex items-center justify-center overflow-visible">
                      {/* Background Clouds */}
                      <svg viewBox="0 0 100 100" className="absolute w-[130%] h-[130%] overflow-visible pointer-events-none drop-shadow-[1.5px_2.5px_0px_#081a36]">
                        {/* Cloud bubbles */}
                        <circle cx="34" cy="34" r="15" fill="#fff" stroke="#081a36" strokeWidth="3" />
                        <circle cx="66" cy="34" r="15" fill="#fff" stroke="#081a36" strokeWidth="3" />
                        <circle cx="30" cy="62" r="15" fill="#fff" stroke="#081a36" strokeWidth="3" />
                        <circle cx="70" cy="62" r="15" fill="#fff" stroke="#081a36" strokeWidth="3" />
                        <circle cx="50" cy="48" r="19" fill="#fff" stroke="#081a36" strokeWidth="3" />
                        
                        {/* Explosion burst in yellow */}
                        <polygon points="50,12 58,34 78,26 68,48 88,52 68,62 78,84 58,74 50,92 42,74 22,84 32,62 12,52 32,48 22,26 42,34" fill="#facc15" stroke="#081a36" strokeWidth="3.5" />
                      </svg>
                      {/* Text FREE! */}
                      <span className="relative z-10 font-['Luckiest_Guy'] text-[10px] text-red-600 uppercase tracking-tighter select-none font-bold rotate-[-10deg] drop-shadow-[1px_1.5px_0px_#fff]">
                        FREE!
                      </span>
                    </div>
                  ) : (
                    <span className="font-['Comic_Neue'] font-extrabold text-xl leading-none text-[#081a36] drop-shadow-[0.5px_0.5px_0px_rgba(255,255,255,0.8)]">
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
      <div className="flex justify-between items-center mt-3 pt-2.5 px-1.5 border-t-2 border-[#081a36]/20">
        <span className="font-['Comic_Neue'] font-extrabold text-[9px] text-[#081a36]/60 tracking-wider">
          EDICIÓN 75 FAMILIAR
        </span>
        <span className="font-['Comic_Neue'] font-extrabold text-[9px] text-[#081a36] tracking-wider flex items-center gap-0.5">
          <span className="text-red-500">♦</span> BINGO FAMILIAR
        </span>
      </div>

    </div>
  )
}

export { BINGO_LETTERS }
