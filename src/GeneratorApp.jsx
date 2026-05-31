import { useState } from 'react'
import { Database, Download, LayoutGrid, Star, Home, RefreshCw } from 'lucide-react'
import solibingoLogo from './assets/solibingo_hero.png'
import BingoCard from './components/BingoCard.jsx'

// Utilidades de BINGO
const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O']
const LETTER_COLORS = {
  B: 'from-red-500 to-rose-600',
  I: 'from-blue-500 to-indigo-600',
  N: 'from-violet-500 to-purple-600',
  G: 'from-emerald-500 to-green-600',
  O: 'from-orange-500 to-amber-600',
}

function getDistinctRandoms(min, max, count) {
  const nums = new Set()
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return Array.from(nums)
}

function generateCartonMatrix() {
  const B = getDistinctRandoms(1, 15, 5)
  const I = getDistinctRandoms(16, 30, 5)
  const N = getDistinctRandoms(31, 45, 5)
  N[2] = 0 // Comodín
  const G = getDistinctRandoms(46, 60, 5)
  const O = getDistinctRandoms(61, 75, 5)

  const matrix = []
  for (let r = 0; r < 5; r++) {
    matrix.push([B[r], I[r], N[r], G[r], O[r]])
  }
  return matrix
}

export default function GeneratorApp() {
  const [count, setCount] = useState(1000)
  const [tickets, setTickets] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    // Usamos setTimeout para permitir que React renderice el estado "generando" en la UI antes del loop pesado
    setTimeout(() => {
      const newTickets = []
      const c = Math.min(Math.max(parseInt(count) || 0, 1), 20000)
      
      for (let i = 1; i <= c; i++) {
        newTickets.push({
          ticket_number: String(i).padStart(5, '0'),
          matrix: generateCartonMatrix()
        })
      }
      setTickets(newTickets)
      setIsGenerating(false)
    }, 50)
  }

  const handleDownload = () => {
    if (tickets.length === 0) return
    const blob = new Blob([JSON.stringify(tickets, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bingo_tickets.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleGoHome = () => {
    window.location.hash = ''
  }

  const handleCountChange = (e) => {
    let val = e.target.value
    setCount(val)
  }

  return (
    <div className="min-h-screen bg-background text-text p-6 flex flex-col items-center">
      
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-text-muted hover:text-text hover:border-primary/50 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          Volver al Hub
        </button>
      </div>

      {/* Main Panel */}
      <div className="w-full max-w-xl bg-surface rounded-3xl border border-border p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-center">
            Generador de Base de Datos de Bingo
          </h1>
          <p className="text-sm text-text-muted text-center mt-2">
            Crea archivos JSON con cartones únicos válidos para Supabase/Firebase. Reglas de 75 bolas con comodín central.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-muted">
              Cantidad de cartones a generar
            </label>
            <input
              type="number"
              min="1"
              max="20000"
              value={count}
              onChange={handleCountChange}
              className="h-14 bg-surface-light border border-border rounded-xl px-4 text-xl font-bold text-center text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono"
            />
            <p className="text-xs text-text-muted/60 text-center">Máximo permitido: 20000 cartones por archivo</p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || count < 1 || count > 20000}
            className="w-full h-14 bg-gradient-to-r from-primary to-violet-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <LayoutGrid className="w-6 h-6" />
            )}
            {isGenerating ? 'GENERANDO...' : 'GENERAR CARTONES'}
          </button>

          {tickets.length > 0 && (
            <div className="pt-4 border-t border-border animate-fade-in flex flex-col gap-3">
              <div className="flex items-center justify-between px-2 text-sm">
                <span className="text-text-muted">Cartones creados:</span>
                <span className="font-bold text-success">{tickets.length}</span>
              </div>
              <button
                onClick={handleDownload}
                className="w-full h-14 bg-success/20 border border-success/30 text-success font-bold text-lg rounded-xl hover:bg-success/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-6 h-6" />
                Descargar bingo_tickets.json
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {tickets.length > 0 && (
        <div className="w-full max-w-4xl mt-12 animate-slide-in">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <LayoutGrid className="w-5 h-5 text-text-muted" />
            <h2 className="text-lg font-bold tracking-widest text-text-muted uppercase">
              Vista Previa (Primeros 3)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tickets.slice(0, 3).map((ticket) => (
              <BingoCard key={ticket.ticket_number} ticket={ticket} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
