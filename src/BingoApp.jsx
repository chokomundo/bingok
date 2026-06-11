import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
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

import bingoBlackBg from './assets/bingo_black_bg.jpg'
import bingoBlackBgVertical from './assets/bingo_black_bg_vertical.jpg'

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
  { id: 5, name: 'Diagonal', rule: 'ANY_DIAGONAL', pattern: [[1,0,0,0,0], [0,1,0,0,0], [0,0,1,0,0], [0,0,0,1,0], [0,0,0,0,1]] },
  { id: 6, name: 'Doble Línea Horizontal', rule: 'DOUBLE_HORIZONTAL', pattern: [[1,1,1,1,1], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [1,1,1,1,1]] },
  { id: 7, name: 'Doble Línea Vertical', rule: 'DOUBLE_VERTICAL', pattern: [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]] },
  { id: 8, name: 'Corona', rule: 'STATIC', pattern: [[1,1,1,1,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,1]] },
  { id: 9, name: 'Cuatro Esquinas', rule: 'STATIC', pattern: [[1,0,0,0,1], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [1,0,0,0,1]] },
  { id: 10, name: '4 Brackets', rule: 'FOUR_BRACKETS', pattern: [[1,1,0,0,0], [1,1,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]] },
  { id: 11, name: 'Bingo Loco', rule: 'BINGO_LOCO', pattern: [[1,0,1,0,0], [0,1,0,0,1], [1,0,0,1,0], [0,0,1,0,1], [0,1,0,1,0]] },
  { id: 12, name: '1er Cartón Lleno', rule: 'STATIC', pattern: [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]] },
  { id: 13, name: '2do Cartón Lleno', rule: 'STATIC', pattern: [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]] },
]

const playSpinSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play a sequence of ticking sounds simulating a rolling drum
    let time = ctx.currentTime;
    for (let i = 0; i < 22; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 + Math.random() * 220, time);
      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.05);
      
      time += 0.09; // Spacing of the ticking sound
    }
  } catch (e) {
    console.error(e);
  }
};

const playRevealSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play a shiny double-chime when a ball is selected
    const time = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, time); // C5
    osc1.frequency.setValueAtTime(659.25, time + 0.08); // E5
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, time + 0.04); // G5
    osc2.frequency.setValueAtTime(1046.50, time + 0.12); // C6
    
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.35);
    osc2.stop(time + 0.35);
  } catch (e) {
    console.error(e);
  }
};

function evaluateTicket(matrix, prize, calledFlags) {
  const rule = prize.rule;
  const pattern = prize.pattern;

  if (rule === 'STATIC') {
    let missingCount = 0;
    const missingNumbers = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (pattern[r][c] === 1) {
          const val = matrix[r][c];
          if (!calledFlags[val]) {
            missingCount++;
            missingNumbers.push(val);
          }
        }
      }
    }
    return { missingCount, missingNumbers };
  }

  if (rule === 'ANY_HORIZONTAL') {
    let minMissing = 99;
    let minMissingNums = [];
    for (const r of [0, 1, 3, 4]) {
      let missingCount = 0;
      const missingNumbers = [];
      for (let c = 0; c < 5; c++) {
        const val = matrix[r][c];
        if (!calledFlags[val]) {
          missingCount++;
          missingNumbers.push(val);
        }
      }
      if (missingCount < minMissing) {
        minMissing = missingCount;
        minMissingNums = missingNumbers;
      }
    }
    return { missingCount: minMissing, missingNumbers: minMissingNums };
  }

  if (rule === 'DOUBLE_HORIZONTAL') {
    const rows = [0, 1, 3, 4];
    const rowStats = rows.map(r => {
      let count = 0;
      const nums = [];
      for (let c = 0; c < 5; c++) {
        const val = matrix[r][c];
        if (!calledFlags[val]) {
          count++;
          nums.push(val);
        }
      }
      return { count, nums };
    });
    rowStats.sort((a, b) => a.count - b.count);
    const missingCount = rowStats[0].count + rowStats[1].count;
    const missingNumbers = [...rowStats[0].nums, ...rowStats[1].nums];
    return { missingCount, missingNumbers };
  }

  if (rule === 'ANY_VERTICAL') {
    let minMissing = 99;
    let minMissingNums = [];
    for (const c of [0, 1, 3, 4]) {
      let missingCount = 0;
      const missingNumbers = [];
      for (let r = 0; r < 5; r++) {
        const val = matrix[r][c];
        if (!calledFlags[val]) {
          missingCount++;
          missingNumbers.push(val);
        }
      }
      if (missingCount < minMissing) {
        minMissing = missingCount;
        minMissingNums = missingNumbers;
      }
    }
    return { missingCount: minMissing, missingNumbers: minMissingNums };
  }

  if (rule === 'DOUBLE_VERTICAL') {
    const cols = [0, 1, 3, 4];
    const colStats = cols.map(c => {
      let count = 0;
      const nums = [];
      for (let r = 0; r < 5; r++) {
        const val = matrix[r][c];
        if (!calledFlags[val]) {
          count++;
          nums.push(val);
        }
      }
      return { count, nums };
    });
    colStats.sort((a, b) => a.count - b.count);
    const missingCount = colStats[0].count + colStats[1].count;
    const missingNumbers = [...colStats[0].nums, ...colStats[1].nums];
    return { missingCount, missingNumbers };
  }

  if (rule === 'ANY_DIAGONAL') {
    let d1Count = 0;
    const d1Nums = [];
    for (let i = 0; i < 5; i++) {
      const val = matrix[i][i];
      if (!calledFlags[val]) {
        d1Count++;
        d1Nums.push(val);
      }
    }

    let d2Count = 0;
    const d2Nums = [];
    for (let i = 0; i < 5; i++) {
      const val = matrix[i][4 - i];
      if (!calledFlags[val]) {
        d2Count++;
        d2Nums.push(val);
      }
    }

    if (d1Count < d2Count) {
      return { missingCount: d1Count, missingNumbers: d1Nums };
    } else {
      return { missingCount: d2Count, missingNumbers: d2Nums };
    }
  }

  if (rule === 'BINGO_LOCO') {
    let markedCount = 0;
    const unmarkedNums = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const val = matrix[r][c];
        if (calledFlags[val]) {
          markedCount++;
        } else {
          unmarkedNums.push(val);
        }
      }
    }
    const missingCount = Math.max(0, 10 - markedCount);
    return { missingCount, missingNumbers: unmarkedNums };
  }

  if (rule === 'FOUR_BRACKETS') {
    const corners = [
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,3],[0,4],[1,3],[1,4]],
      [[3,0],[3,1],[4,0],[4,1]],
      [[3,3],[3,4],[4,3],[4,4]],
    ];
    let minMissing = 99;
    let minMissingNums = [];
    for (const corner of corners) {
      let count = 0;
      const nums = [];
      for (const [r, c] of corner) {
        const val = matrix[r][c];
        if (!calledFlags[val]) {
          count++;
          nums.push(val);
        }
      }
      if (count < minMissing) {
        minMissing = count;
        minMissingNums = nums;
      }
    }
    return { missingCount: minMissing, missingNumbers: minMissingNums };
  }

  return { missingCount: 99, missingNumbers: [] };
}

export default function BingoApp() {
  const [isGameStarted, setIsGameStarted] = useState(() => { const saved = localStorage.getItem('bingo_isGameStarted'); return saved ? JSON.parse(saved) : false; })
  const [ticketsData, setTicketsData] = useState(() => {
    const saved = localStorage.getItem('bingo_ticketsData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    const mainSaved = localStorage.getItem('bingo_tickets_json');
    if (mainSaved) {
      try {
        const parsed = JSON.parse(mainSaved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [];
  })
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

  const [animationTick, setAnimationTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTick(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch active database files from server on mount
  useEffect(() => {
    fetch('/bingo_tickets.json')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTicketsData(data)
          try {
            localStorage.setItem('bingo_ticketsData', JSON.stringify(data))
          } catch(e) {}
        }
      })
      .catch((err) => {
        console.warn("[Presenter Info] No se pudo descargar bingo_tickets.json del servidor, usando local:", err);
      })
  }, [])

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
    setAvailableNumbers(prev => prev.filter(n => n !== num))
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
    playSpinSound()
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
      playRevealSound()
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

  const [searchQuery, setSearchQuery] = useState('')

  const handleCallSubmit = (e) => {
    e.preventDefault()
    callNumber(inputNumber)
    inputRef.current?.focus()
  }

  // Toggle call status of a specific number directly on the board
  const toggleNumber = useCallback((num) => {
    if (calledNumbers.includes(num)) {
      setCalledNumbers(prev => prev.filter(n => n !== num))
      setAvailableNumbers(prev => [...prev, num].sort((a, b) => a - b))
      setHistory(prev => prev.filter(n => n !== num).slice(0, 5))
      setCurrentNumber(prev => {
        if (prev === num) {
          const remaining = calledNumbers.filter(n => n !== num)
          return remaining.length > 0 ? remaining[remaining.length - 1] : null
        }
        return prev
      })
    } else {
      callNumber(num)
    }
  }, [calledNumbers, callNumber])

  // Undo last called number
  const undoLastNumber = useCallback(() => {
    if (calledNumbers.length === 0) return
    const lastNum = calledNumbers[calledNumbers.length - 1]
    setCalledNumbers(prev => prev.slice(0, -1))
    setAvailableNumbers(prev => [...prev, lastNum].sort((a, b) => a - b))
    setHistory(prev => prev.slice(1))
    setCurrentNumber(calledNumbers.length > 1 ? calledNumbers[calledNumbers.length - 2] : null)
  }, [calledNumbers])

  // Optimize proximity calculation using useMemo (supports 10k tickets)
  const proximityData = useMemo(() => {
    if (ticketsData.length === 0 || prizes.length === 0) return []

    const calledFlags = new Array(76).fill(false)
    calledNumbers.forEach(n => {
      calledFlags[n] = true
    })
    calledFlags[0] = true // Center space is always marked

    const results = []
    const activePrizes = prizes.filter(p => p.status === 'PENDIENTE')
    if (activePrizes.length === 0) return []

    for (let i = 0; i < ticketsData.length; i++) {
      const ticket = ticketsData[i]
      const matrix = ticket.matrix

      for (let j = 0; j < activePrizes.length; j++) {
        const prize = activePrizes[j]
        const { missingCount, missingNumbers } = evaluateTicket(matrix, prize, calledFlags)

        // Only track tickets missing 1, 2, or 3 numbers
        if (missingCount > 0 && missingCount <= 3) {
          results.push({
            ticketNumber: ticket.ticket_number,
            prizeName: prize.name,
            prizeId: prize.id,
            missingCount,
            missingNumbers,
          })
        }
      }
    }

    // Sort by missingCount ascending, then by ticketNumber
    results.sort((a, b) => {
      if (a.missingCount !== b.missingCount) {
        return a.missingCount - b.missingCount
      }
      return parseInt(a.ticketNumber, 10) - parseInt(b.ticketNumber, 10)
    })

    return results
  }, [ticketsData, prizes, calledNumbers])

  // Find proximity details for a specific search ticket
  const searchedTicketResult = useMemo(() => {
    if (!searchQuery || ticketsData.length === 0) return null
    const ticket = ticketsData.find(t => parseInt(t.ticket_number, 10) === parseInt(searchQuery, 10))
    if (!ticket) return { found: false }

    const calledFlags = new Array(76).fill(false)
    calledNumbers.forEach(n => {
      calledFlags[n] = true
    })
    calledFlags[0] = true

    const evaluations = prizes.map(prize => {
      const { missingCount, missingNumbers } = evaluateTicket(ticket.matrix, prize, calledFlags)
      return {
        prizeName: prize.name,
        status: prize.status,
        missingCount,
        missingNumbers,
      }
    })

    return {
      found: true,
      ticketNumber: ticket.ticket_number,
      evaluations,
    }
  }, [searchQuery, ticketsData, prizes, calledNumbers])

  const formatMissingNumbersList = (item) => {
    if (item.prizeName === 'Bingo Loco') {
      return `Cualquier número (${item.missingCount} más)`
    }
    return item.missingNumbers.map(formatBingoNumber).join(', ')
  }

  // Helper: check if a ticket wins a prize using a custom isMarked function
  const checkPrizeWin = (tMat, p, isMarkedFn) => {
    if (p.rule === 'STATIC') {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (p.pattern[r][c] === 1 && !isMarkedFn(r, c)) return false
        }
      }
      return true
    }
    if (p.rule === 'ANY_HORIZONTAL') {
      for (let r = 0; r < 5; r++) {
        if (r === 2) continue
        let rowFull = true
        for (let c = 0; c < 5; c++) { if (!isMarkedFn(r, c)) rowFull = false }
        if (rowFull) return true
      }
      return false
    }
    if (p.rule === 'DOUBLE_HORIZONTAL') {
      let fullRows = 0
      for (let r = 0; r < 5; r++) {
        if (r === 2) continue
        let rowFull = true
        for (let c = 0; c < 5; c++) { if (!isMarkedFn(r, c)) rowFull = false }
        if (rowFull) fullRows++
      }
      return fullRows >= 2
    }
    if (p.rule === 'ANY_VERTICAL') {
      for (let c = 0; c < 5; c++) {
        if (c === 2) continue
        let colFull = true
        for (let r = 0; r < 5; r++) { if (!isMarkedFn(r, c)) colFull = false }
        if (colFull) return true
      }
      return false
    }
    if (p.rule === 'DOUBLE_VERTICAL') {
      let fullCols = 0
      for (let c = 0; c < 5; c++) {
        if (c === 2) continue
        let colFull = true
        for (let r = 0; r < 5; r++) { if (!isMarkedFn(r, c)) colFull = false }
        if (colFull) fullCols++
      }
      return fullCols >= 2
    }
    if (p.rule === 'ANY_DIAGONAL') {
      let mainFull = true, antiFull = true
      for (let i = 0; i < 5; i++) { if (!isMarkedFn(i, i)) mainFull = false }
      for (let i = 0; i < 5; i++) { if (!isMarkedFn(i, 4 - i)) antiFull = false }
      return mainFull || antiFull
    }
    if (p.rule === 'BINGO_LOCO') {
      let count = 0
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) { if (isMarkedFn(r, c)) count++ }
      }
      return count >= 10
    }
    if (p.rule === 'FOUR_BRACKETS') {
      const corners = [
        [[0,0],[0,1],[1,0],[1,1]], [[0,3],[0,4],[1,3],[1,4]],
        [[3,0],[3,1],[4,0],[4,1]], [[3,3],[3,4],[4,3],[4,4]],
      ]
      return corners.some(corner => corner.every(([r, c]) => isMarkedFn(r, c)))
    }
    return false
  }

  // Unified performVerification handler used for both manual inspect and claims verification
  const performVerification = useCallback((ticketNum) => {
    if (!ticketNum) return

    const ticketExists = ticketsData.find(t => parseInt(t.ticket_number, 10) === parseInt(ticketNum, 10))
    if (!ticketExists) {
      alert("Cartón no encontrado en la base de datos cargada.")
      return
    }

    const tMat = ticketExists.matrix
    const isMarked = (r, c) => (tMat[r][c] === 0) || calledNumbers.includes(tMat[r][c])
    // isMarked WITHOUT the last called number (to detect "pisado")
    const isMarkedWithoutLast = (r, c) => {
      const val = tMat[r][c]
      if (val === 0) return true
      if (val === currentNumber) return false
      return calledNumbers.includes(val)
    }

    let wonPrizes = []
    let pisadoPrizes = []
    let combinedPattern = Array(5).fill(0).map(() => Array(5).fill(0))
    
    prizes.forEach(p => {
      if (p.status === 'GANADO') return // skip already closed prizes

      let isWinner = false
      let matchedPattern = Array(5).fill(0).map(() => Array(5).fill(0))

      if (p.rule === 'STATIC') {
        isWinner = true
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (p.pattern[r][c] === 1) {
              matchedPattern[r][c] = 1
              if (!isMarked(r, c)) isWinner = false
            }
          }
        }
      } 
      else if (p.rule === 'ANY_HORIZONTAL' || p.rule === 'DOUBLE_HORIZONTAL') {
        let fullRows = []
        for (let r = 0; r < 5; r++) {
          if (r === 2) continue
          let rowFull = true
          for (let c = 0; c < 5; c++) {
            if (!isMarked(r, c)) rowFull = false
          }
          if (rowFull) fullRows.push(r)
        }
        
        if (p.rule === 'ANY_HORIZONTAL' && fullRows.length >= 1) {
           isWinner = true
           for (let c = 0; c < 5; c++) matchedPattern[fullRows[0]][c] = 1
        } else if (p.rule === 'DOUBLE_HORIZONTAL' && fullRows.length >= 2) {
           isWinner = true
           for (let c = 0; c < 5; c++) {
              matchedPattern[fullRows[0]][c] = 1
              matchedPattern[fullRows[1]][c] = 1
           }
        }
      }
      else if (p.rule === 'ANY_VERTICAL' || p.rule === 'DOUBLE_VERTICAL') {
        let fullCols = []
        for (let c = 0; c < 5; c++) {
          if (c === 2) continue
          let colFull = true
          for (let r = 0; r < 5; r++) {
            if (!isMarked(r, c)) colFull = false
          }
          if (colFull) fullCols.push(c)
        }
        
        if (p.rule === 'ANY_VERTICAL' && fullCols.length >= 1) {
           isWinner = true
           for (let r = 0; r < 5; r++) matchedPattern[r][fullCols[0]] = 1
        } else if (p.rule === 'DOUBLE_VERTICAL' && fullCols.length >= 2) {
           isWinner = true
           for (let r = 0; r < 5; r++) {
              matchedPattern[r][fullCols[0]] = 1
              matchedPattern[r][fullCols[1]] = 1
           }
        }
      }
      else if (p.rule === 'ANY_DIAGONAL') {
        let mainDiagFull = true
        for (let i = 0; i < 5; i++) {
          if (!isMarked(i, i)) mainDiagFull = false
        }
        let antiDiagFull = true
        for (let i = 0; i < 5; i++) {
          if (!isMarked(i, 4 - i)) antiDiagFull = false
        }
        if (mainDiagFull || antiDiagFull) {
          isWinner = true
          if (mainDiagFull) {
            for (let i = 0; i < 5; i++) matchedPattern[i][i] = 1
          }
          if (antiDiagFull) {
            for (let i = 0; i < 5; i++) matchedPattern[i][4 - i] = 1
          }
        }
      }
      else if (p.rule === 'BINGO_LOCO') {
        let markedCount = 0
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (isMarked(r, c)) {
              markedCount++
              matchedPattern[r][c] = 1
            }
          }
        }
        if (markedCount >= 10) {
          isWinner = true
        } else {
          matchedPattern = Array(5).fill(0).map(() => Array(5).fill(0))
        }
      }
      else if (p.rule === 'FOUR_BRACKETS') {
        const corners = [
          [[0,0],[0,1],[1,0],[1,1]],
          [[0,3],[0,4],[1,3],[1,4]],
          [[3,0],[3,1],[4,0],[4,1]],
          [[3,3],[3,4],[4,3],[4,4]],
        ]
        for (const corner of corners) {
          const allMarked = corner.every(([r, c]) => isMarked(r, c))
          if (allMarked) {
            isWinner = true
            corner.forEach(([r, c]) => { matchedPattern[r][c] = 1 })
            break
          }
        }
      }

      // If winner, check if it's "pisado" (would also win WITHOUT the last called number)
      if (isWinner && currentNumber) {
        const wouldWinWithoutLast = checkPrizeWin(tMat, p, isMarkedWithoutLast)
        if (wouldWinWithoutLast) {
          // Bingo pisado — the ticket already had the pattern before the last ball
          isWinner = false
          pisadoPrizes.push(p)
        }
      }

      if (isWinner) {
        wonPrizes.push(p)
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (matchedPattern[r][c] === 1) combinedPattern[r][c] = 1
          }
        }
      }
    })

    let totalMatchedOnTicket = 0
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (isMarked(r, c)) totalMatchedOnTicket++
      }
    }

    setVerifyTicket(ticketNum)
    setMatchedTicketDetails({
      matrix: ticketExists.matrix,
      matchedCount: totalMatchedOnTicket,
      pattern: combinedPattern,
      wonPrizeNames: wonPrizes.map(p => p.name),
      pisadoPrizeNames: pisadoPrizes.map(p => p.name),
    })

    if (wonPrizes.length > 0) {
      setVerificationResult('WINNER')
    } else if (pisadoPrizes.length > 0) {
      setVerificationResult('PISADO')
    } else {
      setVerificationResult('FALSE_BINGO')
    }
    setVerificationStage('RESULT')
    setGameState('VERIFICANDO')
    setShowVerifyModal(true)
  }, [ticketsData, calledNumbers, prizes, currentNumber])

  const handlePerformVerification = () => {
    performVerification(verifyTicket)
  }

  const handleInspectTicket = (ticketNum) => {
    performVerification(ticketNum)
  }

  const openVerifyModal = () => {
    setGameState('VERIFICANDO')
    setShowVerifyModal(true)
    setVerifyTicket('')
    setVerificationStage('INPUT')
    setVerificationResult(null)
    setMatchedTicketDetails(null)
  }

  const confirmWinnerAndAssign = () => {
    setPrizes(prev => {
      const newPrizes = prev.map(p => {
        if (matchedTicketDetails.wonPrizeNames.includes(p.name)) {
          const newWinners = p.winners.includes(verifyTicket) ? p.winners : [...p.winners, verifyTicket];
          return { ...p, winners: newWinners } // Don't change status — allow more winners
        }
        return p;
      });
      return newPrizes;
    })
    setShowVerifyModal(false)
    setGameState('JUGANDO')
  }

  // Manually close a prize (no more winners allowed)
  const closePrize = (prizeId) => {
    setPrizes(prev => prev.map(p => {
      if (p.id === prizeId && p.winners.length > 0) {
        return { ...p, status: 'GANADO' }
      }
      return p;
    }))
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
    if (!window.confirm("¿Estás seguro de reiniciar? Se borrará todo el progreso de la partida actual, pero se conservarán los cartones cargados.")) return

    localStorage.removeItem('bingo_isGameStarted')
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
    setSelectedPatternIds([])
    setAvailableNumbers(Array.from({ length: 75 }, (_, i) => i + 1))
    setIsSpinning(false)
    setSpinDisplay(null)
    setIsGameStarted(false)
  }

  const totalCalled = calledNumbers.length

  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-background text-text p-4 flex flex-col items-center justify-center relative">
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

          {/* Section A: Upload / Bingo Loco Logo */}
          <div className="mb-8 p-6 bg-surface-light rounded-2xl border border-border flex flex-col items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">1. Base de Datos</h2>
            
            {ticketsData.length === 0 ? (
              /* --- No tickets loaded: Show cloud upload dropzone --- */
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-xl cursor-pointer hover:bg-primary/5 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 text-primary mb-2" />
                  <p className="text-sm font-bold text-text mb-1">Cargar bingo_tickets.json</p>
                  <p className="text-xs text-text-muted">Haz clic para buscar en tus archivos</p>
                </div>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            ) : (
              /* --- Tickets loaded: Show premium Bingo Loco branded logo --- */
              <div className="relative w-full flex flex-col items-center py-4">
                {/* Glow background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/15 rounded-full blur-[60px] pointer-events-none" />
                
                {/* Bingo Loco Logo */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  {/* Animated bingo balls ring */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Rotating outer ring of mini bingo balls */}
                    {['B', 'I', 'N', 'G', 'O'].map((letter, i) => {
                      const angle = (i * 72 - 90) * (Math.PI / 180);
                      const radius = 46;
                      const x = Math.cos(angle + (animationTick * 0.3)) * radius;
                      const y = Math.sin(angle + (animationTick * 0.3)) * radius;
                      const ballColors = {
                        B: 'from-rose-500 to-red-600 shadow-rose-500/50',
                        I: 'from-indigo-500 to-blue-600 shadow-indigo-500/50',
                        N: 'from-purple-500 to-violet-600 shadow-purple-500/50',
                        G: 'from-emerald-500 to-green-600 shadow-emerald-500/50',
                        O: 'from-orange-500 to-amber-600 shadow-orange-500/50',
                      };
                      return (
                        <div
                          key={letter}
                          className={`absolute w-7 h-7 rounded-full bg-gradient-to-br ${ballColors[letter]} shadow-lg flex items-center justify-center border border-white/20 transition-all duration-1000`}
                          style={{ 
                            transform: `translate(${x}px, ${y}px)`,
                          }}
                        >
                          <span className="text-[9px] font-black text-white drop-shadow">{letter}</span>
                        </div>
                      );
                    })}
                    
                    {/* Center logo sphere */}
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-700 shadow-[0_0_30px_rgba(234,179,8,0.6)] border-2 border-yellow-300/40 flex items-center justify-center z-10">
                      <div className="absolute inset-[2px] rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_30%,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                      <Star className="w-7 h-7 text-black/80 z-10 drop-shadow" />
                    </div>
                  </div>

                  {/* Title text */}
                  <div className="text-center">
                    <h3 className="text-2xl font-black tracking-tight leading-none">
                      <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">BINGO</span>{' '}
                      <span className="text-white">LOCO</span>
                    </h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.25em] mt-1">Sistema de Cartones Activo</p>
                  </div>

                  {/* Ticket count badge */}
                  <div className="flex items-center gap-2 bg-success/10 border border-success/20 px-5 py-2 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm font-black text-success">{ticketsData.length.toLocaleString()}</span>
                    <span className="text-xs font-bold text-success/70">cartones listos</span>
                  </div>

                  {/* Re-upload link */}
                  <label className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-primary cursor-pointer transition-colors font-semibold mt-1 group">
                    <UploadCloud className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    Cambiar archivo
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
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
                        row.map((cell, cIdx) => {
                          let isPattern = cell === 1;
                          if (pat.rule === 'ANY_HORIZONTAL') {
                            const validRows = [0, 1, 3, 4];
                            isPattern = (rIdx === validRows[animationTick % 4]);
                          } else if (pat.rule === 'ANY_VERTICAL') {
                            const validCols = [0, 1, 3, 4];
                            isPattern = (cIdx === validCols[animationTick % 4]);
                          } else if (pat.rule === 'ANY_DIAGONAL') {
                            const diagType = animationTick % 2;
                            isPattern = diagType === 0 ? (rIdx === cIdx) : (rIdx + cIdx === 4);
                          } else if (pat.rule === 'DOUBLE_HORIZONTAL') {
                            const doubleRowPairs = [[0, 4], [0, 1], [1, 3], [3, 4]];
                            isPattern = doubleRowPairs[animationTick % 4].includes(rIdx);
                          } else if (pat.rule === 'DOUBLE_VERTICAL') {
                            const doubleColPairs = [[0, 4], [0, 1], [1, 3], [3, 4]];
                            isPattern = doubleColPairs[animationTick % 4].includes(cIdx);
                          } else if (pat.rule === 'FOUR_BRACKETS') {
                            // Animate cycling through each 2x2 corner
                            const bracketCorners = [
                              [[0,0],[0,1],[1,0],[1,1]],
                              [[0,3],[0,4],[1,3],[1,4]],
                              [[3,0],[3,1],[4,0],[4,1]],
                              [[3,3],[3,4],[4,3],[4,4]],
                            ];
                            const activeCorner = bracketCorners[animationTick % 4];
                            isPattern = activeCorner.some(([r, c]) => r === rIdx && c === cIdx);
                          } else if (pat.rule === 'BINGO_LOCO') {
                            // Animated scattered pattern: random-looking cells that shift each tick
                            const locoPatterns = [
                              [[1,0,1,0,0],[0,1,0,0,1],[1,0,0,1,0],[0,0,1,0,1],[0,1,0,1,0]],
                              [[0,1,0,1,0],[1,0,0,1,0],[0,0,1,0,1],[1,0,0,0,1],[0,1,1,0,0]],
                              [[0,0,1,0,1],[0,1,0,1,0],[1,0,1,0,0],[0,1,0,0,1],[1,0,0,1,0]],
                              [[1,0,0,1,0],[0,0,1,0,1],[0,1,0,1,0],[1,0,1,0,0],[0,1,0,0,1]],
                            ];
                            isPattern = locoPatterns[animationTick % 4][rIdx][cIdx] === 1;
                          }

                          return (
                            <div 
                              key={`${rIdx}-${cIdx}`} 
                              className={`w-1.5 h-1.5 rounded-[1px] transition-all duration-300 ${
                                isPattern 
                                  ? (isSelected ? 'bg-primary scale-110 shadow-[0_0_4px_rgba(234,179,8,0.8)]' : 'bg-text-muted') 
                                  : 'bg-surface-light border border-border/30'
                              }`}
                            />
                          )
                        })
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
                  <div key={`header-${letter}`} className={`flex items-center justify-center rounded-md md:rounded-lg font-black text-xs md:text-sm lg:text-xs xl:text-sm py-1 lg:py-0.5 ${colors[letter]}`}>
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
                  
                  let cellClasses = "flex items-center justify-center rounded-md md:rounded-lg font-black text-xs lg:text-[11px] xl:text-xs h-6 lg:h-full transition-all duration-300 select-none "
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

        {/* ═══ CENTER: Tómbola ═══ */}
        <div className="flex flex-col gap-3 min-h-0 order-1 lg:order-2">

          {/* Tómbola */}
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {/* Tómbola virtual */}
            <div 
              className="flex-1 bg-[#0e0524] rounded-2xl border border-[#221443] flex flex-col items-center justify-center p-4 md:p-6 pt-8 md:pt-12 relative overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(rgba(14, 5, 36, 0.65), rgba(14, 5, 36, 0.85)), url(${bingoBlackBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Glow ambiental */}
              <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-700 ${
                  isSpinning ? 'w-64 h-64 md:w-80 md:h-80 bg-yellow-500/20 scale-110' : 'w-40 h-40 md:w-48 md:h-48 bg-yellow-500/5'
                }`} />
              </div>
              
              {/* Contadores Centrados arriba del Título */}
              <div className="flex items-center gap-4 mb-4 z-10">
                {/* Bolas cantadas */}
                <div className="flex flex-col items-center bg-[#0a031a]/85 rounded-2xl px-4 py-2 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-wider text-emerald-400/80">Cantadas</span>
                  <span className="text-xl md:text-2xl font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] leading-none mt-0.5">{totalCalled}</span>
                </div>
                {/* Bolas restantes */}
                <div className="flex flex-col items-center bg-[#0a031a]/85 rounded-2xl px-4 py-2 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-wider text-amber-400/80">Restantes</span>
                  <span className="text-xl md:text-2xl font-black text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)] leading-none mt-0.5">{75 - totalCalled}</span>
                </div>
              </div>

              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#7c7297] mb-4 md:mb-5 z-10 font-black">✦ TÓMBOLA VIRTUAL ✦</p>
              
              {/* Sphere */}
              <div className={`relative rounded-full flex items-center justify-center mb-4 md:mb-5 z-10 transition-all duration-500 shrink-0 ${
                isSpinning
                  ? 'w-36 h-36 md:w-48 md:h-48 shadow-[0_0_60px_rgba(234,179,8,0.7)] border-4 border-yellow-400 scale-105'
                  : 'w-32 h-32 md:w-44 md:h-44 shadow-[0_0_35px_rgba(234,179,8,0.25)] border-4 border-yellow-500/30'
              } bg-[radial-gradient(circle_at_30%_30%,#2c2c2c_0%,#111111_70%,#000000_100%)]`}>
                <div className="absolute top-3 left-6 md:top-4 md:left-8 w-10 md:w-14 h-5 md:h-7 bg-white/10 rounded-full blur-md" />
                <div className="absolute top-1 left-3 md:top-2 md:left-4 w-5 md:w-7 h-5 md:h-7 bg-white/15 rounded-full blur-sm" />
                
                {isSpinning && spinDisplay !== null ? (
                  <div className="text-center select-none" key={spinDisplay}>
                    <span className="block text-xs md:text-base font-black text-yellow-400 tracking-wider uppercase">{getLetterForNumber(spinDisplay)}</span>
                    <span className="block text-5xl md:text-7xl font-black text-white leading-none" style={{ textShadow: '0 0 30px rgba(234,179,8,0.9)' }}>
                      {spinDisplay}
                    </span>
                  </div>
                ) : currentNumber && !isSpinning ? (
                  <div className="text-center select-none">
                    <span className="block text-xs md:text-base font-black text-yellow-400 tracking-wider uppercase">{getLetterForNumber(currentNumber)}</span>
                    <span className="block text-5xl md:text-7xl font-black text-white leading-none" style={{ textShadow: '0 0 20px rgba(251,191,36,0.6)' }}>
                      {currentNumber}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-[#7c7297]/40">
                    <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-yellow-500/20" />
                    <span className="text-[9px] md:text-xs font-black uppercase tracking-widest">Listo</span>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-yellow-400 z-10 mb-4 md:mb-5 font-bold tracking-wider">
                <span className="font-black text-base md:text-lg mr-1">{availableNumbers.length}</span> bolas restantes
              </p>
              
              <button
                onClick={drawRandomBall}
                disabled={isSpinning || gameState === 'VERIFICANDO' || availableNumbers.length === 0}
                className="z-10 h-11 md:h-12 px-6 md:px-10 bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-[#0f0729] font-black text-xs md:text-sm rounded-xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed flex items-center gap-2.5 tracking-wider font-sans"
              >
                <Play className={`w-3.5 md:w-4 h-3.5 md:h-4 fill-current ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? 'GIRANDO...' : 'EXTRAER BOLA'}
              </button>

              {/* Últimas 5 bolas cantadas — debajo de la tómbola */}
              <div className="z-10 mt-5 w-full border-t border-[#221443]/40 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[.25em] text-[#7c7297] mb-3 text-center">Últimas bolas cantadas</p>
                <div className="flex gap-3 items-center justify-center min-h-[56px]">
                  {history.length === 0 ? (
                    <span className="text-[#7c7297]/40 text-xs italic py-2">Sin bolas cantadas aún...</span>
                  ) : (
                    history.map((num, i) => (
                      <div key={`${num}-${i}`} className={`flex flex-col items-center justify-center rounded-full border shrink-0 transition-all duration-300 ${
                        i === 0
                          ? `w-14 h-14 md:w-16 md:h-16 ${LETTER_BALL_GRADIENT[getLetterForNumber(num)]} border-white/20 scale-110 shadow-lg`
                          : `w-10 h-10 md:w-12 md:h-12 ${LETTER_BALL_GRADIENT[getLetterForNumber(num)]} border-white/10 opacity-60 hover:opacity-90`
                      }`}>
                        <span className={`font-black uppercase leading-none ${i === 0 ? 'text-[8px] md:text-[9px] text-white/80' : 'text-[7px] md:text-[8px] text-white/60'}`}>{getLetterForNumber(num)}</span>
                        <span className={`font-black leading-none ${i === 0 ? 'text-lg md:text-xl text-white' : 'text-sm md:text-base text-white'}`}>{num}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Premios + Verificar ═══ */}
        <div className="flex flex-col gap-3 min-h-0 lg:justify-between order-3 lg:order-3">
          {/* Box: PREMIOS DEL SORTEO */}
          <div 
            className="bg-[#0e0524] rounded-2xl border border-[#221443] p-4 flex-1 flex flex-col min-h-0 relative overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(rgba(14, 5, 36, 0.75), rgba(14, 5, 36, 0.85)), url(${bingoBlackBgVertical})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
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
                        let isPattern = cell === 1;

                        if (prize.status === 'PENDIENTE') {
                          if (prize.rule === 'ANY_HORIZONTAL') {
                            const validRows = [0, 1, 3, 4];
                            const activeRow = validRows[animationTick % 4];
                            isPattern = (rIdx === activeRow);
                          } else if (prize.rule === 'ANY_VERTICAL') {
                            const validCols = [0, 1, 3, 4];
                            const activeCol = validCols[animationTick % 4];
                            isPattern = (cIdx === activeCol);
                          } else if (prize.rule === 'ANY_DIAGONAL') {
                            const diagType = animationTick % 2;
                            isPattern = diagType === 0 ? (rIdx === cIdx) : (rIdx + cIdx === 4);
                          } else if (prize.rule === 'DOUBLE_HORIZONTAL') {
                            const doubleRowPairs = [[0, 4], [0, 1], [1, 3], [3, 4]];
                            const activePair = doubleRowPairs[animationTick % 4];
                            isPattern = activePair.includes(rIdx);
                          } else if (prize.rule === 'DOUBLE_VERTICAL') {
                            const doubleColPairs = [[0, 4], [0, 1], [1, 3], [3, 4]];
                            const activePair = doubleColPairs[animationTick % 4];
                            isPattern = activePair.includes(cIdx);
                          } else if (prize.rule === 'FOUR_BRACKETS') {
                            const bracketCorners = [
                              [[0,0],[0,1],[1,0],[1,1]],
                              [[0,3],[0,4],[1,3],[1,4]],
                              [[3,0],[3,1],[4,0],[4,1]],
                              [[3,3],[3,4],[4,3],[4,4]],
                            ];
                            const activeCorner = bracketCorners[animationTick % 4];
                            isPattern = activeCorner.some(([r, c]) => r === rIdx && c === cIdx);
                          } else if (prize.rule === 'BINGO_LOCO') {
                            const locoPatterns = [
                              [[1,0,1,0,0],[0,1,0,0,1],[1,0,0,1,0],[0,0,1,0,1],[0,1,0,1,0]],
                              [[0,1,0,1,0],[1,0,0,1,0],[0,0,1,0,1],[1,0,0,0,1],[0,1,1,0,0]],
                              [[0,0,1,0,1],[0,1,0,1,0],[1,0,1,0,0],[0,1,0,0,1],[1,0,0,1,0]],
                              [[1,0,0,1,0],[0,0,1,0,1],[0,1,0,1,0],[1,0,1,0,0],[0,1,0,0,1]],
                            ];
                            isPattern = locoPatterns[animationTick % 4][rIdx][cIdx] === 1;
                          }
                        }

                        return (
                          <div 
                            key={`${rIdx}-${cIdx}`} 
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-all duration-300 ${
                              isPattern 
                                ? (prize.status === 'GANADO' 
                                    ? 'bg-success rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]' 
                                    : 'bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)] scale-110') 
                                : 'bg-[#060212] rounded-sm border border-[#221443]/40'
                            }`} 
                          />
                        )
                      }))}
                    </div>
                  </div>
                  <div className={`py-1.5 px-1.5 text-center text-[8px] font-black uppercase tracking-wider border-t border-[#221443]/30 ${
                    prize.status === 'GANADO' ? 'bg-success text-white' : prize.winners.length > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'text-[#7c7297]/60 bg-[#0a041a]/40'
                  }`}>
                    {prize.status === 'GANADO' 
                      ? `✓ ${prize.winners.map(w => `#${w}`).join(', ')}` 
                      : prize.winners.length > 0 
                        ? `${prize.winners.map(w => `#${w}`).join(', ')}` 
                        : 'Pendiente'}
                  </div>
                  {prize.winners.length > 0 && prize.status !== 'GANADO' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); closePrize(prize.id); }}
                      className="w-full py-1.5 bg-success/20 hover:bg-success/30 text-success text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border-t border-success/20"
                    >
                      Cerrar Jugada ✓
                    </button>
                  )}
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

                        const hasLinePrize = matchedTicketDetails.wonPrizeNames.some(name => 
                          name.toLowerCase().includes('línea') || name.toLowerCase().includes('linea')
                        );

                        let styleClasses = "aspect-square flex items-center justify-center rounded font-black text-xs transition-all relative ";
                        
                        if (cell === 0) {
                          styleClasses += "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
                        } else if (isLastCalled) {
                          // Último número cantado — resaltado dorado especial
                          styleClasses += "bg-gradient-to-br from-yellow-400 to-amber-500 text-background border-2 border-white shadow-[0_0_15px_rgba(234,179,8,0.9)] z-10 scale-105 animate-pulse";
                        } else if (isMatched && isRequired) {
                          if (hasLinePrize) {
                            styleClasses += "animate-winning-line text-white z-20 scale-110 border-2";
                          } else {
                            styleClasses += "bg-success text-white shadow-[0_0_15px_rgba(16,185,129,0.6)] z-10 scale-105 border border-success";
                          }
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
                  
                  <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center ${
                    verificationResult === 'WINNER'
                      ? 'bg-success/15 border-success/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse'
                      : verificationResult === 'PISADO'
                        ? 'bg-amber-500/15 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        : 'bg-danger/15 border-danger/30 shadow-[0_0_20px_rgba(220,38,38,0.15)]'
                  }`}>
                    <h2 className={`text-xl font-black tracking-wider ${
                      verificationResult === 'WINNER' ? 'text-success' 
                      : verificationResult === 'PISADO' ? 'text-amber-400' 
                      : 'text-danger'
                    }`}>
                      {verificationResult === 'WINNER' ? '¡¡TICKET GANADOR!!' 
                       : verificationResult === 'PISADO' ? '⚠️ BINGO PISADO' 
                       : 'BINGO FALSO'}
                    </h2>
                    {verificationResult === 'PISADO' && (
                      <p className="text-xs text-amber-300/80 mt-2 font-semibold leading-tight">
                        Este cartón ya tenía el patrón completo ANTES de la última bola cantada. No es válido.
                      </p>
                    )}
                  </div>

                  <div className="bg-[#180c35] rounded-xl border border-[#221443] p-4 text-center">
                     <p className="text-[10px] text-[#7c7297] mb-1.5 uppercase tracking-widest font-black">Resumen de Casillas</p>
                     <p className="text-white text-base font-black">
                       Aciertos del Cartón: <span className={verificationResult === 'WINNER' ? 'text-success' : verificationResult === 'PISADO' ? 'text-amber-400' : 'text-danger'}>{matchedTicketDetails.matchedCount}</span> / 25
                     </p>
                     <p className="text-xs font-black mt-2 whitespace-pre-line leading-tight">
                       {verificationResult === 'WINNER' 
                         ? <span className="text-yellow-400">{`JUGADAS LOGRADAS:\n${matchedTicketDetails.wonPrizeNames.join(', ')}`}</span>
                         : verificationResult === 'PISADO'
                           ? <span className="text-amber-400">{`JUGADAS PISADAS:\n${matchedTicketDetails.pisadoPrizeNames.join(', ')}`}</span>
                           : <span className="text-danger">No coincide con ningún patrón activo.</span>}
                     </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    {verificationResult === 'WINNER' && (
                      <button
                        onClick={confirmWinnerAndAssign}
                        className="h-14 w-full bg-gradient-to-r from-success to-emerald-500 hover:from-emerald-500 hover:to-success text-white font-black text-base rounded-xl shadow-lg shadow-success/15 hover:shadow-success/30 hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 font-sans"
                      >
                        <Trophy className="w-5 h-5" />
                        Confirmar y Anotar Ganador
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

