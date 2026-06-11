import { useState, useEffect } from 'react'
import { Database, Download, LayoutGrid, Star, Home, RefreshCw } from 'lucide-react'
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
  const [isSynced, setIsSynced] = useState(false)
  const [syncError, setSyncError] = useState(null)

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (Array.isArray(data) && data.length > 0 && data[0].ticket_number && data[0].matrix) {
          setTickets(data)
        } else {
          alert('El archivo no tiene el formato correcto de cartones de Bingo Black.')
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.')
      }
      e.target.value = null // resetear input
    }
    reader.readAsText(file)
  }

  // --- AUTOMATIC TICKET DATABASE SYNC WITH BOT SERVER & CENTRAL FILES ---
  useEffect(() => {
    if (tickets.length > 0) {
      setIsSynced(false);
      setSyncError(null);
      
      // 1. Guardar en localStorage para actualización inmediata en Panel de Ventas y Buscador
      try {
        localStorage.setItem('bingo_tickets_json', JSON.stringify(tickets));
        console.log('[Local Storage Sync] Cartones guardados localmente para Panel de Ventas.');
      } catch (err) {
        console.warn('[Sync Storage Warning] Exceso de cuota en almacenamiento local:', err);
      }
      
      // 2. Sincronizar con el backend de Vite (actualiza public/bingo_tickets.json para el Panel de Ventas y descarga)
      fetch('/api/upload-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tickets)
      })
      .then(res => res.json())
      .then(resData => {
        console.log('[Web Sync] Cartones escritos exitosamente en public/bingo_tickets.json en disco:', resData);
      })
      .catch(err => {
        console.warn('[Web Sync Error] No se pudo escribir en disco mediante Vite:', err);
      });

      // 3. Sincronizar con el Servidor API Express (Puerto 5000 - Bot de WhatsApp)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const syncTimeout = setTimeout(() => {
        fetch(`${API_URL}/api/tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tickets })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsSynced(true);
            console.log('[Bot Sync] Cartones sincronizados con el bot de WhatsApp exitosamente.');
          } else {
            setSyncError('El servidor de bot retornó un error de sincronización.');
          }
        })
        .catch(err => {
          console.warn('[Bot Sync Error] No se pudo conectar con el servidor bot:', err.message);
          setSyncError('El bot no está disponible. Levanta el backend con npm start en /server.');
        });
      }, 500);

      return () => clearTimeout(syncTimeout);
    } else {
      setIsSynced(false);
      setSyncError(null);
    }
  }, [tickets]);

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

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#221443]/50"></div>
            <span className="flex-shrink mx-4 text-xs text-text-muted/50 font-bold uppercase tracking-widest">O TAMBIÉN</span>
            <div className="flex-grow border-t border-[#221443]/50"></div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-muted text-center">
              ¿Ya tienes cartones? Sube tu archivo JSON para el bot
            </label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#221443] hover:border-primary/60 rounded-xl cursor-pointer hover:bg-primary/5 transition-all">
              <div className="flex flex-col items-center justify-center pt-2">
                <Database className="w-5 h-5 text-primary mb-1" />
                <p className="text-xs font-bold text-text mb-0.5">Sincronizar archivo bingo_tickets.json</p>
                <p className="text-[10px] text-text-muted/60">Haz clic para buscar tu archivo JSON</p>
              </div>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {tickets.length > 0 && (
            <div className="pt-4 border-t border-border animate-fade-in flex flex-col gap-3">
              <div className="flex items-center justify-between px-2 text-sm">
                <span className="text-text-muted">Cartones cargados:</span>
                <span className="font-bold text-success">{tickets.length}</span>
              </div>
              
              <button
                onClick={handleDownload}
                className="w-full h-14 bg-success/10 border border-success/20 text-success font-bold text-lg rounded-xl hover:bg-success/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-6 h-6" />
                Descargar bingo_tickets.json
              </button>

              {isSynced ? (
                <div className="flex items-center justify-center gap-2.5 text-success bg-success/10 border border-success/20 px-4 py-3 rounded-xl font-bold text-xs">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                  ¡{tickets.length} Cartones sincronizados con el Bot de WhatsApp!
                </div>
              ) : syncError ? (
                <div className="flex flex-col items-center justify-center gap-1 text-amber-500 bg-amber-500/5 border border-amber-500/20 px-4 py-3 rounded-xl font-medium text-[11px] text-center">
                  <p className="font-bold">⚠️ Sincronización pendiente con el Bot:</p>
                  <p className="opacity-80">{syncError}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-text-muted bg-surface-light border border-border/40 px-4 py-3 rounded-xl font-medium text-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sincronizando cartones con el Bot de WhatsApp...
                </div>
              )}
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
