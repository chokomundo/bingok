import { useState, useCallback, useEffect } from 'react'
import { Upload, Trash2, Download, BarChart3, Clock, Hash, ArrowLeft, AlertTriangle, CheckCircle, FileJson, ShieldAlert, X, ChevronRight, Database } from 'lucide-react'

export default function SalesPanel() {
  // Load data immediately in state initializers to prevent empty flash and ensure high responsiveness
  const [tickets, setTickets] = useState(() => {
    const storedTickets = localStorage.getItem('bingo_tickets_json')
    if (storedTickets) {
      try {
        const data = JSON.parse(storedTickets)
        if (Array.isArray(data)) return data
      } catch {}
    }
    return []
  })

  const [downloads, setDownloads] = useState(() => {
    const storedDownloads = localStorage.getItem('bingo_downloads_log')
    if (storedDownloads) {
      try {
        const data = JSON.parse(storedDownloads)
        if (Array.isArray(data)) return data
      } catch {}
    }
    return []
  })

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Fetch active database files from server on mount
  useEffect(() => {
    fetch('/bingo_tickets.json')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTickets(data)
          localStorage.setItem('bingo_tickets_json', JSON.stringify(data))
        }
      })
      .catch(() => {})

    fetch('/bingo_downloads_log.json')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDownloads(data)
          localStorage.setItem('bingo_downloads_log', JSON.stringify(data))
        }
      })
      .catch(() => {})
  }, [])

  // Reset downloads log only (keeps active JSON base of tickets)
  const handleResetDownloads = () => {
    localStorage.removeItem('bingo_downloads_log')
    setDownloads([])
    setShowConfirmReset(false)

    // Clear server side downloads
    fetch('/api/clear-downloads', { method: 'POST' }).catch(() => {})
  }

  // Trigger reloading of state dynamically
  const reloadData = useCallback(() => {
    const storedTickets = localStorage.getItem('bingo_tickets_json')
    if (storedTickets) {
      try {
        const data = JSON.parse(storedTickets)
        if (Array.isArray(data)) setTickets(data)
      } catch { setTickets([]) }
    } else {
      setTickets([])
    }

    const storedDownloads = localStorage.getItem('bingo_downloads_log')
    if (storedDownloads) {
      try {
        const data = JSON.parse(storedDownloads)
        if (Array.isArray(data)) setDownloads(data)
      } catch { setDownloads([]) }
    } else {
      setDownloads([])
    }

    // Refresh from server
    fetch('/bingo_tickets.json')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTickets(data) })
      .catch(() => {})

    fetch('/bingo_downloads_log.json')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDownloads(data) })
      .catch(() => {})
  }, [])

  // Upload JSON
  const handleUploadJSON = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const rawContent = ev.target.result
        const data = JSON.parse(rawContent)
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem('bingo_tickets_json', rawContent)
          setTickets(data)
          setUploadSuccess(true)
          setTimeout(() => setUploadSuccess(false), 3000)

          // Upload to server side database for global sync
          fetch('/api/upload-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: rawContent
          }).catch((err) => {
            console.error('Error uploading to server', err)
          })
        } else {
          alert('El archivo no contiene un array de cartones válido.')
        }
      } catch {
        alert('Error al leer el archivo JSON. Asegúrese de que es un archivo .json de cartones válido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Remove JSON + clear all data
  const handleRemoveJSON = () => {
    localStorage.removeItem('bingo_tickets_json')
    localStorage.removeItem('bingo_downloads_log')
    setTickets([])
    setDownloads([])
    setShowConfirmDelete(false)

    // Clear server side database and downloads
    fetch('/api/clear-json', { method: 'POST' }).catch(() => {})
    fetch('/api/clear-downloads', { method: 'POST' }).catch(() => {})
  }

  // Export CSV
  const handleExportCSV = () => {
    if (downloads.length === 0) return
    const header = '#,Número de Cartón,Fecha de Descarga\n'
    const rows = downloads.map((d, i) => {
      const date = new Date(d.downloadedAt)
      const formatted = date.toLocaleString('es-BO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
      return `${i + 1},${d.ticketNumber},${formatted}`
    }).join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_ventas_solibingo_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalTickets = tickets.length
  const totalDownloads = downloads.length
  const percentage = totalTickets > 0 ? Math.round((totalDownloads / totalTickets) * 100) : 0

  // Get unique downloaded tickets
  const uniqueDownloads = [...new Set(downloads.map(d => d.ticketNumber))].length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b031e] via-[#080214] to-[#120530] text-white relative overflow-x-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        
        {/* Navigation / Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[#221443]/40 pb-6">
          <div className="flex items-center gap-3">
            <a href="#/hub" className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0e0524]/60 border border-[#221443]/80 hover:border-[#8b5cf6]/40 text-[#7c7297] hover:text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-300 group shadow-sm shadow-[#000]/40">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Volver al Hub
            </a>
            <div className="h-4 w-[1px] bg-[#221443] hidden md:block" />
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-[#7c7297]">
              <span>Suite Operación</span>
              <ChevronRight className="w-3 h-3 text-[#221443]" />
              <span className="text-white">Panel de Ventas</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[#7c7297] uppercase">Sistema de Distribución</span>
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse" />
          </div>
        </header>

        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-indigo-500 bg-clip-text text-transparent">Distribución</span>{' '}
            & Ventas
          </h1>
          <p className="text-[#7c7297] text-sm mt-1">Cargue y gestione la base de datos de cartones descargables en la landing pública.</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Controls & Analytics */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* ── JSON Management Section ── */}
            <section className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2 mb-4">
                <FileJson className="w-4 h-4 text-[#8b5cf6]" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#7c7297]">Gestión de Base de Datos</h2>
              </div>

              {/* Status Banner */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border mb-5 transition-all ${
                totalTickets > 0
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  {totalTickets > 0 ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-base font-black text-white">Base de datos de cartones activa</p>
                        <p className="text-xs text-[#7c7297] mt-1 leading-relaxed">
                          Se registran <span className="text-emerald-400 font-bold font-mono">{totalTickets.toLocaleString()}</span> cartones válidos. El buscador público está <span className="text-emerald-400 font-bold">habilitado</span> en <a href="#/buscar" className="text-amber-400 hover:underline font-bold font-mono">#/buscar</a>.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-base font-black text-white">Distribución inactiva</p>
                        <p className="text-xs text-[#7c7297] mt-1 leading-relaxed">
                          No hay base de datos cargada. El buscador público mostrará un aviso de inactividad para los clientes.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {uploadSuccess && (
                  <div className="self-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-xs font-bold text-emerald-400 flex items-center gap-2 shrink-0 animate-pulse">
                    <CheckCircle className="w-3.5 h-3.5" />
                    ¡Cargado con éxito!
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center justify-center gap-2 h-12 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-[#0f0729] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/15 hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Cargar JSON de Cartones
                  <input type="file" accept=".json" onChange={handleUploadJSON} className="hidden" />
                </label>
                {totalTickets > 0 && (
                  <>
                    <button
                      onClick={() => setShowConfirmReset(true)}
                      className="flex items-center justify-center gap-2 h-12 px-6 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-amber-500/20 hover:border-amber-500/30 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      Restablecer Descargas a 0
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="flex items-center justify-center gap-2 h-12 px-6 bg-red-500/10 border border-red-500/20 text-red-400 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-red-500/20 hover:border-red-500/30 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Quitar Base de Datos
                    </button>
                  </>
                )}
              </div>

              {/* Help Box for Remote Users (Vercel/Netlify/Hosting) */}
              {totalTickets > 0 && (
                <div className="mt-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4.5">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-[#a78bfa] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">📢 ¿Usuarios fuera de tu Red Local (Internet)?</p>
                      <p className="text-xs text-[#7c7297] mt-1.5 leading-relaxed">
                        Si tu página está publicada en internet (ej: Vercel, Netlify o un hosting) y tienes personas que se conectan de lejos, cargar el JSON en este navegador solo lo activa localmente. Para que esté disponible en todo el mundo, sigue estos simples pasos:
                      </p>
                      <ul className="mt-3.5 space-y-2 text-xs text-[#7c7297]">
                        <li className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#180c35] border border-[#221443] text-purple-400 font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Copia tu archivo <strong className="text-white font-mono">bingo_tickets.json</strong> que generaste.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#180c35] border border-[#221443] text-purple-400 font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Pégalo directamente en la carpeta <strong className="text-white font-mono">/public</strong> de tu proyecto en la computadora.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#180c35] border border-[#221443] text-purple-400 font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Vuelve a compilar tu aplicación (<strong className="text-white font-mono">npm run build</strong>) y súbela de nuevo a tu hosting (Vercel, Netlify, etc.).</span>
                        </li>
                      </ul>
                      <p className="text-xs text-amber-400 font-bold mt-3.5 flex items-center gap-1.5 bg-amber-400/5 border border-amber-400/10 px-3 py-2 rounded-xl">
                        <span>⚠️</span>
                        <span>¡Haciendo esto, cualquier persona del mundo podrá buscar y descargar su cartón al instante!</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ── Downloads Table Section ── */}
            <section className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-4 border-b border-[#221443]/40 pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8b5cf6]" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#7c7297]">Historial de Descargas</h2>
                </div>
                {downloads.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 h-9 px-4 bg-[#180c35]/50 border border-[#221443] text-[#7c7297] hover:text-white font-bold text-xs rounded-lg hover:bg-[#221443]/50 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Reporte (.csv)
                  </button>
                )}
              </div>

              {downloads.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#180c35]/40 border border-[#221443] flex items-center justify-center shadow-inner">
                    <Clock className="w-7 h-7 text-[#7c7297]/30" />
                  </div>
                  <p className="text-[#7c7297]/60 text-sm font-black uppercase tracking-wider">Aún no hay descargas</p>
                  <p className="text-[#7c7297]/40 text-xs mt-1">Los registros de boletos descargados por los clientes aparecerán aquí en vivo.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[#221443]/60 text-[#7c7297] text-[10px] font-black uppercase tracking-widest text-left">
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-3">N° Cartón</th>
                        <th className="py-3 px-3">Fecha y Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...downloads].reverse().map((d, i) => {
                        const date = new Date(d.downloadedAt)
                        const formatted = date.toLocaleString('es-BO', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })
                        return (
                          <tr key={i} className="border-b border-[#221443]/20 hover:bg-[#180c35]/30 transition-colors">
                            <td className="py-3 px-3 text-[#7c7297] font-bold font-mono">{(downloads.length - i).toString().padStart(3, '0')}</td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1.5 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-3 py-1 rounded-lg text-amber-400 font-black font-mono tracking-widest text-xs">
                                <Hash className="w-3 h-3 text-[#8b5cf6]" />
                                {d.ticketNumber}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#7c7297] font-medium font-mono text-xs">{formatted}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>

          {/* Right Side: Analytics Cards */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Quick Metrics Header */}
            <div className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#8b5cf6]" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#7c7297]">Estadísticas Básicas</h2>
              </div>

              <div className="flex flex-col gap-5">
                {/* Metric 1 */}
                <div className="bg-[#180c35]/40 border border-[#221443]/60 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7c7297]">Total Descargas</span>
                    <p className="text-2xl font-black text-amber-400 font-mono mt-1">{totalDownloads.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-amber-400" />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-[#180c35]/40 border border-[#221443]/60 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7c7297]">Cartones Únicos</span>
                    <p className="text-2xl font-black text-purple-400 font-mono mt-1">{uniqueDownloads.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Hash className="w-5 h-5 text-purple-400" />
                  </div>
                </div>

                {/* Progress Metric */}
                <div className="bg-[#180c35]/40 border border-[#221443]/60 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7c7297]">Tasa de Descarga</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">{percentage}%</span>
                  </div>
                  
                  <div className="w-full h-2 bg-[#080214] rounded-full overflow-hidden border border-[#221443]/40">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="text-[10px] text-[#7c7297]/60 font-semibold italic text-center">
                    Descargas únicas vs cartones totales cargados
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#8b5cf6]" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#7c7297]">Servicio del Servidor</h2>
              </div>
              <div className="text-xs text-[#7c7297] leading-relaxed flex flex-col gap-2.5">
                <div className="flex justify-between border-b border-[#221443]/30 pb-2">
                  <span>Tipo de almacenamiento</span>
                  <span className="text-white font-bold font-mono">Local / Client-side</span>
                </div>
                <div className="flex justify-between border-b border-[#221443]/30 pb-2">
                  <span>Persistencia activa</span>
                  <span className="text-emerald-400 font-bold">Habilitado</span>
                </div>
                <div className="flex justify-between border-b border-[#221443]/30 pb-2">
                  <span>Modo del Buscador</span>
                  <span className={totalTickets > 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                    {totalTickets > 0 ? "En línea" : "Fuera de línea"}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <footer className="text-center mt-12 border-t border-[#221443]/30 pt-6">
          <p className="text-[#7c7297]/30 text-[9px] font-black uppercase tracking-[0.35em]">
            Panel de Administración • Solibingo v3.0
          </p>
        </footer>

      </div>

      {/* ── Confirm Delete Modal ── */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0524] border border-red-500/20 rounded-3xl p-6 max-w-md w-full shadow-[0_30px_60px_rgba(220,38,38,0.15)] animate-bounce-in">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">¿Quitar Base de Datos?</h3>
                <p className="text-xs text-[#7c7297]">Esta acción eliminará todos los registros</p>
              </div>
            </div>
            
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 mb-5">
              <p className="text-xs text-red-300 leading-relaxed font-semibold">
                Al desactivar la base de datos se <span className="font-bold text-white uppercase">deshabilitará</span> el buscador público en <span className="underline">#/buscar</span> y se eliminarán permanentemente las <span className="font-bold text-white">{totalDownloads} descargas</span>.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 h-11 bg-[#180c35]/60 border border-[#221443] text-[#7c7297] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#221443]/50 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleRemoveJSON}
                className="flex-1 h-11 bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/40 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Reset Downloads Modal ── */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0524] border border-amber-500/20 rounded-3xl p-6 max-w-md w-full shadow-[0_30px_60px_rgba(245,158,11,0.15)] animate-bounce-in">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">¿Restablecer Descargas a 0?</h3>
                <p className="text-xs text-[#7c7297]">Esta acción reiniciará las estadísticas de ventas</p>
              </div>
            </div>
            
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 mb-5">
              <p className="text-xs text-amber-300 leading-relaxed font-semibold">
                Se eliminará todo el historial de <span className="font-bold text-white font-mono">{totalDownloads} descargas</span> y los contadores volverán a 0. La base de datos de <span className="font-bold text-white">{totalTickets.toLocaleString()} cartones</span> se mantendrá intacta y activa.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 h-11 bg-[#180c35]/60 border border-[#221443] text-[#7c7297] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#221443]/50 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleResetDownloads}
                className="flex-1 h-11 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-600/20 hover:shadow-amber-600/40 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
