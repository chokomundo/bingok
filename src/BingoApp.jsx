import { useState, useCallback, useRef, useEffect } from 'react'
import { Trophy, Bell, AlertTriangle, Hash, Sparkles, X, RotateCcw, Volume2, UploadCloud, CheckCircle2, Star, Grid, Play } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// --- BINGO BOARD HELPERS ---
const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']
const LETTER_RANGES = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
}
const LETTER_COLORS = {
  B: 'from-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.35)]',
  I: 'from-indigo-500 to-blue-600 shadow-[0_0_12px_rgba(99,102,241,0.35)]',
  N: 'from-purple-500 to-violet-600 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
  G: 'from-emerald-500 to-green-600 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  O: 'from-orange-500 to-amber-600 shadow-[0_0_12px_rgba(249,115,22,0.35)]',
}
const LETTER_BG = {
  B: 'bg-rose-500/20 text-rose-400',
  I: 'bg-indigo-500/20 text-indigo-400',
  N: 'bg-purple-500/20 text-purple-400',
  G: 'bg-emerald-500/20 text-emerald-400',
  O: 'bg-orange-500/20 text-orange-400',
}
const LETTER_BALL_GRADIENT = {
  B: 'bg-[radial-gradient(circle_at_35%_35%,#ff6b8b_0%,#e11d48_60%,#4c0519_100%)] border-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.6)]',
  I: 'bg-[radial-gradient(circle_at_35%_35%,#818cf8_0%,#4f46e5_60%,#1e1b4b_100%)] border-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.6)]',
  N: 'bg-[radial-gradient(circle_at_35%_35%,#c084fc_0%,#9333ea_60%,#3b0764_100%)] border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.6)]',
  G: 'bg-[radial-gradient(circle_at_35%_35%,#34d399_0%,#059669_60%,#022c22_100%)] border-emerald-500 shadow-[0_0_12px_rgba(5,150,105,0.6)]',
  O: 'bg-[radial-gradient(circle_at_35%_35%,#fb923c_0%,#ea580c_60%,#431407_100%)] border-orange-500 shadow-[0_0_12px_rgba(234,88,12,0.6)]',
}

function getLetterForNumber(num) {
  if (num >= 1 && num <= 15) return 'B'
  if (num >= 16 && num <= 30) return 'I'
  if (num >= 31 && num <= 45) return 'N'
  if (num >= 46 && num <= 60) return 'G'
  if (num >= 61 && num <= 75) return 'O'
  return ''
}

function formatBingoNumber(num) {
  return `${getLetterForNumber(num)}-${num}`
}

// --- AVAILABLE PATTERNS ---
const AVAILABLE_PATTERNS = [
  { id: 1, name: 'Letra X', rule: 'STATIC', pattern: [[1,0,0,0,1], [0,1,0,1,0], [0,0,1,0,0], [0,1,0,1,0], [1,0,0,0,1]] },
  { id: 2, name: 'Cruz', rule: 'STATIC', pattern: [[0,0,1,0,0], [0,0,1,0,0], [1,1,1,1,1], [0,0,1,0,0], [0,0,1,0,0]] },
  { id: 3, name: 'Línea Horizontal', rule: 'ANY_HORIZONTAL', pattern: [[0,0,0,0,0], [0,0,0,0,0], [1,1,1,1,1], [0,0,0,0,0], [0,0,0,0,0]] },
  { id: 4, name: 'Línea Vertical', rule: 'ANY_VERTICAL', pattern: [[0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0]] },
  { id: 5, name: 'Doble Línea Horizontal', rule: 'DOUBLE_HORIZONTAL', pattern: [[1,1,1,1,1], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [1,1,1,1,1]] },
  { id: 6, name: 'Doble Línea Vertical', rule: 'DOUBLE_VERTICAL', pattern: [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]] },
  { id: 7, name: 'Corona', rule: 'STATIC', pattern: [[1,1,1,1,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,1]] },
  { id: 8, name: 'Cuatro Esquinas', rule: 'STATIC', pattern: [[1,0,0,0,1], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [1,0,0,0,1]] },
  { id: 9, name: 'Cartón Lleno', rule: 'STATIC', pattern: [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]] },
]

export default function BingoApp() {
  const [isGameStarted, setIsGameStarted] = useState(() => { const saved = localStorage.getItem('bingo_isGameStarted'); return saved ? JSON.parse(saved) : false; })
  const [ticketsData, setTicketsData] = useState(() => { const saved = localStorage.getItem('bingo_ticketsData'); return saved ? JSON.parse(saved) : []; })
  const [selectedPatternIds, setSelectedPatternIds] = useState([])

  const [calledNumbers, setCalledNumbers] = useState(() => { const saved = localStorage.getItem('bingo_calledNumbers'); return saved ? JSON.parse(saved) : []; })
  const [currentNumber, setCurrentNumber] = useState(null)
  const [history, setHistory] = useState(() => { const saved = localStorage.getItem('bingo_history'); return saved ? JSON.parse(saved) : []; })
  const [gameState, setGameState] = useState(() => { const saved = localStorage.getItem('bingo_gameState'); return saved ? JSON.parse(saved) : 'JUGANDO'; })
  const [prizes, setPrizes] = useState(() => { const saved = localStorage.getItem('bingo_prizes'); return saved ? JSON.parse(saved) : []; })
  const [availableNumbers, setAvailableNumbers] = useState(() => {
    const saved = localStorage.getItem('bingo_calledNumbers')
    const called = saved ? JSON.parse(saved) : []
    return Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !called.includes(n))
  })
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinDisplay, setSpinDisplay] = useState(null)
  const spinIntervalRef = useRef(null)

  useEffect(() => { localStorage.setItem('bingo_isGameStarted', JSON.stringify(isGameStarted)) }, [isGameStarted])
  useEffect(() => { 
    try { 
      localStorage.setItem('bingo_ticketsData', JSON.stringify(ticketsData)); 
    } catch(e) { 
      console.warn("No se pudo guardar la BD en cache local (posible exceso de cuota)", e); 
    } 
  }, [ticketsData])
  useEffect(() => { localStorage.setItem('bingo_calledNumbers', JSON.stringify(calledNumbers)) }, [calledNumbers])
  useEffect(() => { localStorage.setItem('bingo_history', JSON.stringify(history)) }, [history])
  useEffect(() => { localStorage.setItem('bingo_gameState', JSON.stringify(gameState)) }, [gameState])
  useEffect(() => { localStorage.setItem('bingo_prizes', JSON.stringify(prizes)) }, [prizes])
  // Call a number
  const callNumber = useCallback((numStr) => {
    const num = parseInt(numStr, 10)
    if (isNaN(num) || num < 1 || num > 75) return
    if (calledNumbers.includes(num)) return

    setCalledNumbers(prev => [...prev, num])
    setCurrentNumber(num)
    setHistory(prev => [num, ...prev].slice(0, 5))
    setLastCalledAnim(num)
    setInputNumber('')

    // Clear animation after a moment
    setTimeout(() => setLastCalledAnim(null), 700)
  }, [calledNumbers])

  const drawRandomBall = useCallback(() => {
    if (availableNumbers.length === 0 || gameState === 'VERIFICANDO' || isSpinning) return
    setIsSpinning(true)
    const allNums = Array.from({ length: 75 }, (_, i) => i + 1)
    let tick = 0
    spinIntervalRef.current = setInterval(() => {
      setSpinDisplay(allNums[Math.floor(Math.random() * allNums.length)])
      tick++
    }, 80)
    setTimeout(() => {
      clearInterval(spinIntervalRef.current)
      const idx = Math.floor(Math.random() * availableNumbers.length)
      const picked = availableNumbers[idx]
      setAvailableNumbers(prev => prev.filter(n => n !== picked))
      setSpinDisplay(null)
      callNumber(picked)
      setIsSpinning(false)
    }, 2000)
  }, [availableNumbers, gameState, isSpinning, callNumber])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (Array.isArray(data)) {
          setTicketsData(data)
        } else {
          alert('Formato de JSON incorrecto')
        }
      } catch (err) {
        alert("Error al leer el archivo JSON.")
      }
      e.target.value = null // resetear onchange
    }
    reader.readAsText(file)
  }

  const togglePattern = (id) => {
    setSelectedPatternIds(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id) 
        : (prev.length < 4 ? [...prev, id] : prev)
    )
  }

  const startGame = () => {
    if (ticketsData.length === 0 || selectedPatternIds.length !== 4) return
    
    const newPrizes = selectedPatternIds.map((id, index) => {
      const pat = AVAILABLE_PATTERNS.find(p => p.id === id)
      return { id: index + 1, name: pat.name, status: 'PENDIENTE', winners: [], pattern: pat.pattern, rule: pat.rule || 'STATIC' }
    })
    setPrizes(newPrizes)
    setIsGameStarted(true)
  }
  const [inputNumber, setInputNumber] = useState('')
  const [verifyTicket, setVerifyTicket] = useState('')
  const [verificationStage, setVerificationStage] = useState('INPUT')
  const [verificationResult, setVerificationResult] = useState(null)
  const [matchedTicketDetails, setMatchedTicketDetails] = useState(null)

  const [lastCalledAnim, setLastCalledAnim] = useState(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const inputRef = useRef(null)

  const handleCallSubmit = (e) => {
    e.preventDefault()
    callNumber(inputNumber)
    inputRef.current?.focus()
  }

  // Verify winner
  // Verify winner
  const openVerifyModal = () => {
    setGameState('VERIFICANDO')
    setShowVerifyModal(true)
    setVerifyTicket('')
    setVerificationStage('INPUT')
    setVerificationResult(null)
    setMatchedTicketDetails(null)
  }

  const handlePerformVerification = () => {
    if (!verifyTicket) return

    const ticketExists = ticketsData.find(t => t.ticket_number === String(verifyTicket))
    if (!ticketExists) {
      alert("Cartón no encontrado en la base de datos cargada.")
      return
    }

    const tMat = ticketExists.matrix;
    const isMarked = (r, c) => (tMat[r][c] === 0) || calledNumbers.includes(tMat[r][c]);

    let wonPrizes = [];
    let combinedPattern = Array(5).fill(0).map(() => Array(5).fill(0));
    
    // Evaluate against all 4 current prizes
    prizes.forEach(p => {
      let isWinner = false;
      let matchedPattern = Array(5).fill(0).map(() => Array(5).fill(0));

      if (p.rule === 'STATIC') {
        isWinner = true;
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (p.pattern[r][c] === 1) {
              matchedPattern[r][c] = 1;
              if (!isMarked(r, c)) isWinner = false;
            }
          }
        }
      } 
      else if (p.rule === 'ANY_HORIZONTAL' || p.rule === 'DOUBLE_HORIZONTAL') {
        let fullRows = [];
        for (let r = 0; r < 5; r++) {
          if (r === 2) continue; // Ignorar explícitamente la fila del medio
          let rowFull = true;
          for (let c = 0; c < 5; c++) {
            if (!isMarked(r, c)) rowFull = false;
          }
          if (rowFull) fullRows.push(r);
        }
        
        if (p.rule === 'ANY_HORIZONTAL' && fullRows.length >= 1) {
           isWinner = true;
           for (let c = 0; c < 5; c++) matchedPattern[fullRows[0]][c] = 1;
        } else if (p.rule === 'DOUBLE_HORIZONTAL' && fullRows.length >= 2) {
           isWinner = true;
           for (let c = 0; c < 5; c++) {
              matchedPattern[fullRows[0]][c] = 1;
              matchedPattern[fullRows[1]][c] = 1;
           }
        }
      }
      else if (p.rule === 'ANY_VERTICAL' || p.rule === 'DOUBLE_VERTICAL') {
        let fullCols = [];
        for (let c = 0; c < 5; c++) {
          if (c === 2) continue; // Ignorar explícitamente la columna N del medio
          let colFull = true;
          for (let r = 0; r < 5; r++) {
            if (!isMarked(r, c)) colFull = false;
          }
          if (colFull) fullCols.push(c);
        }
        
        if (p.rule === 'ANY_VERTICAL' && fullCols.length >= 1) {
           isWinner = true;
           for (let r = 0; r < 5; r++) matchedPattern[r][fullCols[0]] = 1;
        } else if (p.rule === 'DOUBLE_VERTICAL' && fullCols.length >= 2) {
           isWinner = true;
           for (let r = 0; r < 5; r++) {
              matchedPattern[r][fullCols[0]] = 1;
              matchedPattern[r][fullCols[1]] = 1;
           }
        }
      }

      if (isWinner) {
        wonPrizes.push(p);
        // Combinar sub-matriz a la matriz maestra del UI
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (matchedPattern[r][c] === 1) combinedPattern[r][c] = 1;
          }
        }
      }
    });

    // matchedCount is total called numbers matching the ticket (independent of pattern borders)
    let totalMatchedOnTicket = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (isMarked(r, c)) totalMatchedOnTicket++;
      }
    }

    setMatchedTicketDetails({
      matrix: ticketExists.matrix,
      matchedCount: totalMatchedOnTicket,
      pattern: combinedPattern,
      wonPrizeNames: wonPrizes.map(p => p.name)
    })

    setVerificationResult(wonPrizes.length > 0 ? 'WINNER' : 'FALSE_BINGO')
    setVerificationStage('RESULT')
  }

  const confirmWinnerAndAssign = () => {
    setPrizes(prev => {
      const newPrizes = prev.map(p => {
        if (matchedTicketDetails.wonPrizeNames.includes(p.name)) {
          const newWinners = p.winners.includes(verifyTicket) ? p.winners : [...p.winners, verifyTicket];
          return { ...p, status: 'GANADO', winners: newWinners }
        }
        return p;
      });
      return newPrizes;
    })
    setShowVerifyModal(false)
    setGameState('JUGANDO')
  }

  const cancelVerify = () => {
    if (verificationStage === 'RESULT') {
       setVerificationStage('INPUT');
       setVerificationResult(null);
       setMatchedTicketDetails(null);
       return;
    }
    setShowVerifyModal(false)
    setGameState('JUGANDO')
  }

  // Reset game
  const resetGame = () => {
    if (!window.confirm("¿Estás seguro de reiniciar? Se borrará todo el progreso de la partida actual.")) return

    localStorage.removeItem('bingo_isGameStarted')
    localStorage.removeItem('bingo_ticketsData')
    localStorage.removeItem('bingo_calledNumbers')
    localStorage.removeItem('bingo_history')
    localStorage.removeItem('bingo_gameState')
    localStorage.removeItem('bingo_prizes')

    setCalledNumbers([])
    setCurrentNumber(null)
    setHistory([])
    setGameState('JUGANDO')
    setPrizes([])
    setInputNumber('')
    setTicketsData([])
    setSelectedPatternIds([])
    setAvailableNumbers(Array.from({ length: 75 }, (_, i) => i + 1))
    setIsSpinning(false)
    setSpinDisplay(null)
    setIsGameStarted(false)
  }

  const totalCalled = calledNumbers.length

  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-background text-text p-4 flex flex-col relative">
        <a href="#/hub" className="absolute top-4 left-4 p-2 bg-surface border border-border/50 text-text-muted hover:text-white rounded-full transition-all duration-300 group flex items-center gap-2 hover:border-text/30 shadow-lg hover:shadow-primary/20 z-50">
          <div className="bg-surface-light rounded-full p-2 group-hover:bg-primary transition-colors">
            <Grid className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm pr-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[150px]">
            Volver al Hub
          </span>
        </a>
        <div className="w-full max-w-3xl bg-surface rounded-3xl border border-border p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">Configuración de Sala</h1>
            <p className="text-text-muted">Carga tu base de datos y elige 4 jugadas para iniciar la transmisión.</p>
          </div>

          {/* Section A: Upload */}
          <div className="mb-8 p-6 bg-surface-light rounded-2xl border border-border flex flex-col items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">1. Base de Datos</h2>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-xl cursor-pointer hover:bg-primary/5 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 text-primary mb-2" />
                <p className="text-sm font-bold text-text mb-1">Cargar bingo_tickets.json</p>
                <p className="text-xs text-text-muted">Haz clic para buscar en tus archivos</p>
              </div>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            {ticketsData.length > 0 && (
              <div className="flex items-center gap-2 text-success bg-success/10 px-4 py-2 rounded-full font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                {ticketsData.length} cartones cargados correctamente
              </div>
            )}
          </div>

          {/* Section B: Patterns */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">2. Seleccionar 4 Jugadas</h2>
              <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-full">{selectedPatternIds.length} / 4</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {AVAILABLE_PATTERNS.map(pat => {
                const isSelected = selectedPatternIds.includes(pat.id);
                return (
                  <div 
                    key={pat.id} 
                    onClick={() => togglePattern(pat.id)}
                    className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-text-muted/30'}`}
                  >
                    <div className="grid grid-cols-5 gap-[2px] w-10">
                      {pat.pattern.flatMap((row, rIdx) => 
                        row.map((cell, cIdx) => (
                          <div 
                            key={`${rIdx}-${cIdx}`} 
                            className={`w-1.5 h-1.5 rounded-[1px] ${cell === 1 ? (isSelected ? 'bg-primary' : 'bg-text-muted') : 'bg-surface-light border border-border/30'}`}
                          />
                        ))
                      )}
                    </div>
                    <span className="text-xs font-bold text-center leading-tight">{pat.name}</span>
                  </div>
                )
              })}
            </div>
          </div>


          {/* Section D: Start Button */}
          <button
            onClick={startGame}
            disabled={ticketsData.length === 0 || selectedPatternIds.length !== 4}
            className="w-full h-14 bg-gradient-to-r from-primary to-amber-500 text-white font-black text-lg rounded-xl shadow-lg hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            INICIAR BINGO
          </button>
        </div>
      </div>
    )
  }

   return (
    <div className="min-h-screen lg:h-screen bg-background p-3 md:p-5 flex flex-col lg:overflow-hidden overflow-y-auto relative">
      <a href="#/hub" className="absolute top-4 left-4 p-2 bg-surface border border-border/50 text-text-muted hover:text-white rounded-full transition-all duration-300 group flex items-center gap-2 hover:border-text/30 shadow-lg hover:shadow-primary/20 z-50">
        <div className="bg-surface-light rounded-full p-2 group-hover:bg-primary transition-colors">
          <Grid className="w-5 h-5" />
        </div>
        <span className="font-bold text-sm pr-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[150px]">
          Volver al Hub
        </span>
      </a>

      {/* Top bar */}
      <header className="flex flex-col sm:flex-row items-center justify-between mb-3 shrink-0 ml-12 md:ml-20 gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-700 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)] border border-yellow-300/30 shrink-0">
            <div className="absolute inset-[3px] rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_30%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-black z-10 drop-shadow animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight leading-none text-center sm:text-left">
              <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">BINGO</span>{' '}
               <span className="text-white">EN VIVO</span>
            </h1>
            <p className="text-[9px] md:text-[10px] text-[#7c7297] tracking-widest uppercase mt-1 font-bold text-center sm:text-left">Tablero maestro</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0e0524] rounded-xl px-3 py-2 md:px-4 md:py-2.5 border border-[#221443]">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs font-bold text-[#7c7297]">Bolas:</span>
            <span className="text-sm font-black text-yellow-400">{totalCalled}</span>
            <span className="text-xs font-bold text-white">/ 75</span>
          </div>
          {gameState === 'VERIFICANDO' && (
            <div className="flex items-center gap-2 bg-danger/20 text-danger rounded-xl px-4 py-2 border border-danger/30 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold text-sm">VERIFICANDO</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout: LEFT pizarra ancha | CENTER bolas+tómbola | RIGHT controles */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_290px] gap-3 min-h-0">

        {/* ═══ LEFT: Pizarra BINGO (ancha, premium) ═══ */}
        <div className="min-h-0 flex flex-col gap-3 order-2 lg:order-1">

          {/* Último número — badge grande encima de la pizarra */}
          <div className="shrink-0 bg-[#0e0524] rounded-2xl border border-[#221443] p-3 md:p-4 flex items-center gap-4 relative overflow-hidden">
            {currentNumber ? (
              <>
                <div className={`shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center border border-white/20 ${LETTER_BALL_GRADIENT[getLetterForNumber(currentNumber)]}`}>
                  <span className="text-[9px] md:text-[10px] font-black text-white/70 uppercase tracking-widest">{getLetterForNumber(currentNumber)}</span>
                  <span className="text-2xl md:text-3xl font-black text-white leading-none">{currentNumber}</span>
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[.15em] text-[#7c7297]">Última bola</p>
                  <p className="text-xl md:text-2xl font-black text-white leading-tight mt-0.5">{formatBingoNumber(currentNumber)}</p>
                  <p className="text-[9px] md:text-[10px] text-[#7c7297] mt-0.5 font-semibold">{availableNumbers.length} restantes de 75</p>
                </div>
              </>
            ) : (
              <div className="w-full flex items-center gap-3 py-1">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-surface-light border-2 border-dashed border-[#221443] flex items-center justify-center shrink-0">
                  <span className="text-xl text-[#7c7297]/40">?</span>
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[.15em] text-[#7c7297]">Esperando inicio</p>
                  <p className="text-xs md:text-sm font-bold text-[#7c7297]/60 mt-0.5">Extrae la primera bola</p>
                </div>
              </div>
            )}
          </div>

          {/* Pizarra de números */}
          <div className="flex-1 min-h-0 bg-[#0e0524] rounded-2xl border border-[#221443] p-3 md:p-4 flex flex-col">
            {/* Título */}
            <div className="flex items-center justify-between mb-3 px-1 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[.25em] text-[#7c7297]">Pizarra</span>
              <span className="text-xs font-bold text-yellow-400">{totalCalled} / 75</span>
            </div>
            {/* Grid */}
            <div className="flex-1 grid grid-cols-5 grid-rows-[auto_repeat(15,1fr)] gap-1 md:gap-[5px] min-h-0">
              {BINGO_LETTERS.map((letter) => {
                const colors = {
                  B: 'bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.3)]',
                  I: 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]',
                  N: 'bg-purple-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]',
                  G: 'bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]',
                  O: 'bg-orange-600 text-white shadow-[0_0_8px_rgba(249,115,22,0.3)]',
                }
                return (
                  <div key={`header-${letter}`} className={`flex items-center justify-center rounded-lg font-black text-xs md:text-base py-1 md:py-2 ${colors[letter]}`}>
                    {letter}
                  </div>
                )
              })}
              {Array.from({ length: 15 }, (_, rowIdx) =>
                BINGO_LETTERS.map((letter) => {
                  const [start] = LETTER_RANGES[letter]
                  const num = start + rowIdx
                  const isCalled = calledNumbers.includes(num)
                  const isLatest = currentNumber === num
                  
                  let cellClasses = "flex items-center justify-center rounded-lg font-black text-xs md:text-sm h-8 md:h-auto md:aspect-square transition-all duration-300 select-none "
                  if (isLatest) {
                    cellClasses += `bg-gradient-to-br ${LETTER_COLORS[letter]} text-white ring-2 ring-white ring-offset-1 ring-offset-[#0e0524] scale-105 shadow-lg z-10`
                  } else if (isCalled) {
                    const calledBg = {
                      B: 'bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]',
                      I: 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.4)]',
                      N: 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]',
                      G: 'bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]',
                      O: 'bg-orange-600 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)]',
                    }
                    cellClasses += calledBg[letter]
                  } else {
                    cellClasses += 'bg-[#0a041a]/60 border border-[#1b0d36] text-[#334155]/60'
                  }

                  return (
                    <div key={num} className={cellClasses}>
                      {num}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: Historial arriba + Tómbola ═══ */}
        <div className="flex flex-col gap-3 min-h-0 order-1 lg:order-2">

          {/* Historial de bolas — ARRIBA de la tómbola */}
          <div className="shrink-0 bg-[#0e0524] rounded-2xl border border-[#221443] p-3 md:p-4 flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c7297] mb-2">Últimas bolas cantadas</p>
            <div className="flex gap-2 items-center min-h-[56px] overflow-x-auto pb-1.5">
              {history.length === 0 ? (
                <span className="text-[#7c7297]/40 text-xs italic w-full text-center py-2">Sin bolas cantadas aún...</span>
              ) : (
                <div className="flex gap-2 items-center flex-1">
                  {history.map((num, i) => (
                    <div key={`${num}-${i}`} className={`flex flex-col items-center justify-center rounded-full border border-white/10 shrink-0 transition-all duration-300 ${
                      i === 0
                        ? `w-12 h-12 md:w-14 md:h-14 ${LETTER_BALL_GRADIENT[getLetterForNumber(num)]} scale-105`
                        : `w-9 h-9 md:w-11 md:h-11 ${LETTER_BALL_GRADIENT[getLetterForNumber(num)]} opacity-40 hover:opacity-75`
                    }`}>
                      <span className={`font-black uppercase leading-none ${i === 0 ? 'text-[8px] md:text-[9px] text-white/80' : 'text-[7px] md:text-[8px] text-white/60'}`}>{getLetterForNumber(num)}</span>
                      <span className={`font-black leading-none ${i === 0 ? 'text-base md:text-lg text-white' : 'text-xs md:text-sm text-white'}`}>{num}</span>
                    </div>
                  ))}
                  <div className="ml-auto text-right shrink-0 pl-2">
                    <p className="text-[8px] md:text-[9px] text-[#7c7297] font-bold uppercase tracking-widest">Total</p>
                    <p className="text-2xl md:text-3xl font-black text-yellow-400 leading-none mt-0.5">{totalCalled}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tómbola virtual */}
          <div className="bg-[#0e0524] rounded-2xl border border-[#221443] flex-1 min-h-[300px] md:min-h-0 flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
            {/* Glow ambiental */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-700 ${
                isSpinning ? 'w-64 h-64 md:w-80 md:h-80 bg-yellow-500/20 scale-110' : 'w-40 h-40 md:w-48 md:h-48 bg-yellow-500/5'
              }`} />
            </div>
            
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#7c7297] mb-5 md:mb-6 z-10 font-black">✦ TÓMBOLA VIRTUAL ✦</p>
            
            {/* Sphere */}
            <div className={`relative rounded-full flex items-center justify-center mb-5 md:mb-6 z-10 transition-all duration-500 ${
              isSpinning
                ? 'w-44 h-44 md:w-56 md:h-56 shadow-[0_0_60px_rgba(234,179,8,0.7)] border-4 border-yellow-400 scale-105'
                : 'w-40 h-40 md:w-52 md:h-52 shadow-[0_0_35px_rgba(234,179,8,0.25)] border-4 border-yellow-500/30'
            } bg-[radial-gradient(circle_at_30%_30%,#2c2c2c_0%,#111111_70%,#000000_100%)]`}>
              {/* Internal reflections for a 3D glass sphere look */}
              <div className="absolute top-4 left-8 md:top-5 md:left-10 w-12 md:w-16 h-6 md:h-8 bg-white/10 rounded-full blur-md" />
              <div className="absolute top-2 left-4 md:top-3 md:left-6 w-6 md:w-8 h-6 md:h-8 bg-white/15 rounded-full blur-sm" />
              
              {isSpinning && spinDisplay !== null ? (
                <div className="text-center select-none" key={spinDisplay}>
                  <span className="block text-base md:text-xl font-black text-yellow-400 tracking-wider uppercase">{getLetterForNumber(spinDisplay)}</span>
                  <span className="block text-6xl md:text-8xl font-black text-white leading-none" style={{ textShadow: '0 0 35px rgba(234,179,8,0.9)' }}>
                    {spinDisplay}
                  </span>
                </div>
              ) : currentNumber && !isSpinning ? (
                <div className="text-center select-none">
                  <span className="block text-base md:text-xl font-black text-yellow-400 tracking-wider uppercase">{getLetterForNumber(currentNumber)}</span>
                  <span className="block text-6xl md:text-8xl font-black text-white leading-none" style={{ textShadow: '0 0 25px rgba(251,191,36,0.6)' }}>
                    {currentNumber}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#7c7297]/40">
                  <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-yellow-500/20" />
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Listo</span>
                </div>
              )}
            </div>
            
            <p className="text-xs text-yellow-400 z-10 mb-5 md:mb-6 font-bold tracking-wider">
              <span className="font-black text-base md:text-lg mr-1">{availableNumbers.length}</span> bolas restantes
            </p>
            
            <button
              onClick={drawRandomBall}
              disabled={isSpinning || gameState === 'VERIFICANDO' || availableNumbers.length === 0}
              className="z-10 h-12 md:h-14 px-8 md:px-12 bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-[#0f0729] font-black text-sm md:text-base rounded-2xl shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:scale-[1.03] active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed flex items-center gap-3 tracking-wider font-sans font-black"
            >
              <Play className={`w-4 md:w-5 h-4 md:h-5 fill-current ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning ? 'GIRANDO...' : 'EXTRAER BOLA'}
            </button>
          </div>
        </div>

        {/* ═══ RIGHT: Premios + Verificar ═══ */}
        <div className="flex flex-col gap-3 min-h-0 lg:justify-between order-3 lg:order-3">
          {/* Box: PREMIOS DEL SORTEO */}
          <div className="bg-[#0e0524] rounded-2xl border border-[#221443] p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c7297]">Premios del sorteo</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1">
              {prizes.map((prize, idx) => (
                <div key={prize.id} className={`flex flex-col overflow-hidden rounded-xl border transition-all duration-300 ${
                  prize.status === 'GANADO'
                    ? 'border-success bg-success/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'border-[#221443] bg-[#120a2e]/50'
                }`}>
                  <div className="py-2 px-2 text-center border-b border-[#221443]/40 bg-[#0e0524]/50">
                    <div className="text-[9px] font-black truncate uppercase tracking-wider text-[#7c7297]">
                      {idx + 1}° {prize.name}
                    </div>
                  </div>
                  <div className="py-3 flex justify-center bg-[#09031a]/40">
                    <div className="grid grid-cols-5 gap-[3px]">
                      {prize.pattern.flatMap((row, rIdx) => row.map((cell, cIdx) => {
                        const isPattern = cell === 1
                        return (
                          <div 
                            key={`${rIdx}-${cIdx}`} 
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-all duration-300 ${
                              isPattern 
                                ? (prize.status === 'GANADO' 
                                    ? 'bg-success rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]' 
                                    : 'bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)]') 
                                : 'bg-[#060212] rounded-sm border border-[#221443]/40'
                            }`} 
                          />
                        )
                      }))}
                    </div>
                  </div>
                  <div className={`py-1.5 px-1 text-center text-[9px] font-black uppercase tracking-widest border-t border-[#221443]/30 ${
                    prize.status === 'GANADO' ? 'bg-success text-white font-bold' : 'text-[#7c7297]/60 bg-[#0a041a]/40 font-bold'
                  }`}>
                    {prize.status === 'GANADO' ? `✓ Tkto #${prize.winners[0]}` : 'Pendiente'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box: Botones de control */}
          <div className="shrink-0 flex flex-col gap-2 mt-2">
            <button
              onClick={openVerifyModal}
              disabled={gameState === 'VERIFICANDO'}
              className="w-full h-14 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-red-600/10 hover:shadow-red-600/30 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-red-500/20 tracking-wider font-sans font-black"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              ¡VERIFICAR GANADOR!
            </button>
            <button
              onClick={resetGame}
              className="w-full h-11 bg-transparent border border-[#221443] hover:border-purple-500/30 rounded-xl hover:bg-purple-500/5 active:scale-98 transition-all flex items-center justify-center gap-2 text-[#7c7297] hover:text-white cursor-pointer text-xs font-bold"
              title="Reiniciar juego"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar sorteo
            </button>
          </div>
        </div>
      </div>

      {/* Footer: PROGRESO DEL SORTEO */}
      <div className="shrink-0 bg-[#0e0524] rounded-xl border border-[#221443] px-4 py-3.5 mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-[#7c7297] uppercase tracking-[0.2em]">Progreso del sorteo</span>
          <span className="text-xs font-black text-yellow-400">{Math.round((totalCalled / 75) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-[#060212] rounded-full overflow-hidden border border-[#221443]/30">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
            style={{ width: `${(totalCalled / 75) * 100}%` }} 
          />
        </div>
      </div>

      {/* VERIFICATION MODAL */}
      <Dialog open={showVerifyModal} onOpenChange={(open) => { if (!open) cancelVerify() }}>
        <DialogContent className={`bg-[#0e0524] border border-[#221443] text-white transition-all duration-300 ease-in-out max-h-[90vh] overflow-y-auto ${verificationStage === 'RESULT' ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
          {verificationStage === 'INPUT' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl text-white font-black">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/25">
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                  </div>
                  MODO VERIFICACIÓN
                </DialogTitle>
                <DialogDescription className="text-[#7c7297]">
                  Ingrese el número del cartón de bingo para comprobar automáticamente contra las jugadas vigentes.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Ticket Number */}
                <div>
                  <label className="text-xs font-black text-[#7c7297] uppercase tracking-wider mb-2 block">Número de Ticket a verificar:</label>
                  <input
                    type="text"
                    value={verifyTicket}
                    onChange={(e) => setVerifyTicket(e.target.value)}
                    placeholder="Ej: 00042"
                    className="w-full h-12 bg-[#180c35] border border-[#221443] rounded-xl px-4 text-xl font-black text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all font-mono tracking-widest text-center"
                    autoFocus
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handlePerformVerification}
                  disabled={!verifyTicket}
                  className="h-14 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 text-[#0f0729] font-black text-base rounded-xl shadow-lg shadow-yellow-500/15 hover:shadow-yellow-500/30 hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  VERIFICAR AHORA
                </button>
                <button
                  onClick={cancelVerify}
                  className="h-12 w-full bg-[#180c35] border border-[#221443] text-[#7c7297] font-bold text-xs rounded-xl hover:bg-[#221443]/30 hover:text-white active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  CANCELAR
                </button>
              </div>
            </>
          ) : matchedTicketDetails ? (
            <>
              {/* RESULT STAGE UI */}
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl text-center text-white font-black">
                  Resultado de Verificación
                </DialogTitle>
                <DialogDescription className="text-center text-[#7c7297]">
                  Comparación visual del Ticket #{verifyTicket} contra bolas cantadas
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* COL 1: Visual Matrix */}
                <div className="bg-[#0b041a] p-4 rounded-2xl border border-[#221443] flex flex-col items-center justify-center shadow-inner">
                  <div className="grid grid-cols-5 gap-1 mb-1.5 w-full max-w-[250px]">
                    {BINGO_LETTERS.map(letter => {
                      const colors = {
                        B: 'bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.3)]',
                        I: 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.3)]',
                        N: 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.3)]',
                        G: 'bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]',
                        O: 'bg-orange-600 text-white shadow-[0_0_8px_rgba(249,115,22,0.3)]',
                      }
                      return (
                        <div key={letter} className={`flex items-center justify-center font-black rounded ${colors[letter]} py-1.5 text-xs leading-none`}>
                          {letter}
                        </div>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-5 gap-1 w-full max-w-[250px] relative">
                    {matchedTicketDetails.matrix.flatMap((row, rIdx) => 
                      row.map((cell, cIdx) => {
                        const isRequired = matchedTicketDetails.pattern[rIdx][cIdx] === 1;
                        const isMatched = cell === 0 || calledNumbers.includes(cell);
                        const isFailedRequired = isRequired && !isMatched;
                        const isLastCalled = cell === currentNumber;

                        let styleClasses = "aspect-square flex items-center justify-center rounded font-black text-xs transition-all relative ";
                        
                        if (cell === 0) {
                          styleClasses += "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
                        } else if (isLastCalled) {
                          // Último número cantado — resaltado dorado especial
                          styleClasses += "bg-gradient-to-br from-yellow-400 to-amber-500 text-background border-2 border-white shadow-[0_0_15px_rgba(234,179,8,0.9)] z-10 scale-105 animate-pulse";
                        } else if (isMatched && isRequired) {
                          styleClasses += "bg-success text-white shadow-[0_0_15px_rgba(16,185,129,0.6)] z-10 scale-105 border border-success";
                        } else if (isMatched) {
                          styleClasses += "bg-success/20 text-success border border-success/30";
                        } else if (isFailedRequired) {
                          styleClasses += "bg-danger/20 text-danger border-2 border-danger shadow-[0_0_15px_rgba(220,38,38,0.4)] z-10 animate-pulse";
                        } else {
                          styleClasses += "bg-[#0c051f]/40 text-[#7c7297]/40 border border-[#221443]/30";
                        }

                        return (
                          <div key={`${rIdx}-${cIdx}`} className={styleClasses}>
                             {cell === 0 ? <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> : cell}
                             {isRequired && !isMatched && (
                               <div className="absolute inset-0 border-[2px] border-danger rounded z-20 pointer-events-none" />
                             )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* COL 2: Info & Action */}
                <div className="flex flex-col gap-5 justify-center">
                  
                  <div className={`p-5 rounded-2xl border flex items-center justify-center text-center ${
                    verificationResult === 'WINNER'
                      ? 'bg-success/15 border-success/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse'
                      : 'bg-danger/15 border-danger/30 shadow-[0_0_20px_rgba(220,38,38,0.15)]'
                  }`}>
                    <h2 className={`text-xl font-black ${verificationResult === 'WINNER' ? 'text-success' : 'text-danger'} tracking-wider`}>
                      {verificationResult === 'WINNER' ? '¡¡TICKET GANADOR!!' : 'BINGO FALSO'}
                    </h2>
                  </div>

                  <div className="bg-[#180c35] rounded-xl border border-[#221443] p-4 text-center">
                     <p className="text-[10px] text-[#7c7297] mb-1.5 uppercase tracking-widest font-black">Resumen de Casillas</p>
                     <p className="text-white text-base font-black">
                       Aciertos del Cartón: <span className={verificationResult === 'WINNER' ? 'text-success' : 'text-danger'}>{matchedTicketDetails.matchedCount}</span> / 25
                     </p>
                     <p className="text-xs font-black text-yellow-400 mt-2 whitespace-pre-line leading-tight">
                       {verificationResult === 'WINNER' 
                         ? `JUGADAS LOGRADAS:\n${matchedTicketDetails.wonPrizeNames.join(', ')}`
                         : 'No coincide con ningún patrón activo.'}
                     </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    {verificationResult === 'WINNER' && (
                      <button
                        onClick={confirmWinnerAndAssign}
                        className="h-14 w-full bg-gradient-to-r from-success to-emerald-500 hover:from-emerald-500 hover:to-success text-white font-black text-base rounded-xl shadow-lg shadow-success/15 hover:shadow-success/30 hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 font-sans"
                      >
                        <Trophy className="w-5 h-5" />
                        Confirmar y Asignar
                      </button>
                    )}
                    <button
                      onClick={cancelVerify}
                      className="h-11 w-full bg-[#180c35] border border-[#221443] text-[#7c7297] hover:text-white font-bold text-xs rounded-xl hover:bg-[#221443]/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cerrar Verificación
                    </button>
                  </div>

                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

