import { useState, useCallback, useEffect } from 'react'
import { Upload, Trash2, Download, BarChart3, Clock, Hash, ArrowLeft, AlertTriangle, CheckCircle, FileJson, ShieldAlert, X, ChevronRight, Database, Edit, Save } from 'lucide-react'

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
  const [activeChartTab, setActiveChartTab] = useState('time') // 'time' or 'seller'

  // Authorized Players State
  const [authorizedIds, setAuthorizedIds] = useState(() => {
    const stored = localStorage.getItem('bingo_authorized_ids')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (Array.isArray(data)) return data
      } catch {}
    }
    return []
  })
  const [newIdInput, setNewIdInput] = useState('')
  const [newSellerName, setNewSellerName] = useState('')
  const [newSellerCell, setNewSellerCell] = useState('')
  const [newSellerCI, setNewSellerCI] = useState('')

  // Inline Editing States
  const [editingSellerId, setEditingSellerId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCell, setEditCell] = useState('')
  const [editCI, setEditCI] = useState('')

  // Fetch active database files silently on mount and periodically in background
  useEffect(() => {
    // Initial fetch for everything (including tickets which are static once uploaded)
    fetch('/bingo_tickets.json')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTickets(data)
          localStorage.setItem('bingo_tickets_json', JSON.stringify(data))
        }
      })
      .catch(() => {})

    const fetchDynamicData = () => {
      fetch('/bingo_downloads_log.json')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setDownloads(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(data)) {
                localStorage.setItem('bingo_downloads_log', JSON.stringify(data))
                return data
              }
              return prev
            })
          }
        })
        .catch(() => {})

      fetch('/bingo_authorized_ids.json')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAuthorizedIds(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(data)) {
                localStorage.setItem('bingo_authorized_ids', JSON.stringify(data))
                return data
              }
              return prev
            })
          }
        })
        .catch(() => {})

      fetch('/bingo_seller_rows.json')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSellerRows(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(data)) {
                localStorage.setItem('bingo_seller_rows', JSON.stringify(data))
                return data
              }
              return prev
            })
          }
        })
        .catch(() => {})
    }

    // Run immediately on mount
    fetchDynamicData()

    // Poll every 3 seconds for silent updates
    const interval = setInterval(fetchDynamicData, 3000)

    return () => clearInterval(interval)
  }, [])

  // Add a player ID to the authorized list
  const handleEnableId = (idStr) => {
    // Split the input by newlines, commas, spaces, or semicolons
    const lines = idStr.split(/[\n,\s;]+/).map(line => line.replace(/\D/g, '').trim()).filter(Boolean);
    if (lines.length === 0) {
      alert('El ID (teléfono) del vendedor es obligatorio.')
      return
    }
    
    // Check if any of these numbers are already authorized
    const exists = authorizedIds.some(s => {
      const sId = typeof s === 'object' && s !== null ? s.id : s
      const existingNumbers = String(sId || '').split(/[\n,\s;]+/).map(x => x.trim()).filter(Boolean);
      return lines.some(num => existingNumbers.includes(num));
    })
    
    if (exists) {
      alert('Uno o más de los IDs ingresados ya se encuentra registrado o habilitado.')
      return
    }

    const cleanId = lines.join('\n')

    const newSeller = {
      id: cleanId,
      name: newSellerName.trim(),
      cellphone: newSellerCell.trim(),
      ci: newSellerCI.trim()
    }

    const updated = [...authorizedIds, newSeller]
    setAuthorizedIds(updated)
    localStorage.setItem('bingo_authorized_ids', JSON.stringify(updated))
    
    // Reset inputs
    setNewIdInput('')
    setNewSellerName('')
    setNewSellerCell('')
    setNewSellerCI('')

    // Sync to server
    fetch('/api/save-authorized-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => {
      console.warn('[Sync Error] No se pudo sincronizar la habilitación en el servidor:', err)
    })
  }

  // Remove a player ID from the authorized list
  const handleDisableId = (idToDisable) => {
    const updated = authorizedIds.filter(s => {
      const sId = typeof s === 'object' && s !== null ? s.id : s
      return sId !== idToDisable
    })
    setAuthorizedIds(updated)
    localStorage.setItem('bingo_authorized_ids', JSON.stringify(updated))

    // Sync to server
    fetch('/api/save-authorized-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => {
      console.warn('[Sync Error] No se pudo sincronizar la deshabilitación en el servidor:', err)
    })
  }

  // Helper functions for inline editing
  const startEditing = (seller) => {
    const sId = typeof seller === 'object' && seller !== null ? seller.id : seller
    const sName = typeof seller === 'object' && seller !== null ? seller.name || '' : ''
    const sCell = typeof seller === 'object' && seller !== null ? seller.cellphone || '' : ''
    const sCI = typeof seller === 'object' && seller !== null ? seller.ci || '' : ''

    setEditingSellerId(sId)
    setEditName(sName)
    setEditCell(sCell)
    setEditCI(sCI)
  }

  const saveEdit = (sId) => {
    const updated = authorizedIds.map(s => {
      const currentId = typeof s === 'object' && s !== null ? s.id : s
      if (currentId === sId) {
        return {
          id: sId,
          name: editName.trim(),
          cellphone: editCell.trim(),
          ci: editCI.trim()
        }
      }
      return s
    })
    setAuthorizedIds(updated)
    localStorage.setItem('bingo_authorized_ids', JSON.stringify(updated))
    setEditingSellerId(null)

    // Sync to server
    fetch('/api/save-authorized-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => {
      console.warn('[Sync Error] No se pudo sincronizar la edición en el servidor:', err)
    })
  }

  const cancelEdit = () => {
    setEditingSellerId(null)
  }

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
    const header = '#,Número de Cartón,Fecha de Descarga,ID de Vendedor,Nombre Vendedor,Tipo\n'
    const rows = downloads.map((d, i) => {
      const date = new Date(d.downloadedAt)
      const formatted = date.toLocaleString('es-BO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
      
      let sellerId = d.sellerId;
      let sellerName = d.sellerName;
      
      if (!sellerId || !sellerName || sellerName === 'Desconocido' || sellerName === 'Sin Nombre') {
        const matchedRow = sellerRows.find(row => 
          row.numbers.some(num => String(parseInt(num, 10)) === String(parseInt(d.ticketNumber, 10)))
        );
        if (matchedRow && matchedRow.name) {
          sellerName = matchedRow.name;
          const matchedAuth = authorizedIds.find(auth => 
            auth.name && auth.name.toLowerCase().trim() === matchedRow.name.toLowerCase().trim()
          );
          if (matchedAuth) {
            sellerId = matchedAuth.id;
          }
        }
      }
      
      const finalId = sellerId ? String(sellerId).split(/[\n,\s;]+/).map(x => x.trim()).filter(Boolean).map(num => `+${num}`).join(' / ') : 'Desconocido';
      const finalName = sellerName || 'Desconocido';
      const tipo = d.isGift ? 'Regalo' : 'Normal';
      
      return `${i + 1},${d.ticketNumber},"${formatted}","${finalId}","${finalName}","${tipo}"`
    }).join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_ventas_solibingo_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export active tickets database to JSON file
  const handleDownloadJSON = () => {
    if (tickets.length === 0) return
    const blob = new Blob([JSON.stringify(tickets, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bingo_tickets.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- SELLER SHEET GENERATOR STATE & HANDLERS ---
  const [sellerRows, setSellerRows] = useState(() => {
    const stored = localStorage.getItem('bingo_seller_rows')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (Array.isArray(data)) return data
      } catch {}
    }
    return []
  })
  
  const [numRowsToGen, setNumRowsToGen] = useState(5)

  // Map numbers to beautiful keycap emoji strings (1 -> 1️⃣, 10 -> 🔟, 11 -> 1️⃣1️⃣, 30 -> 3️⃣0️⃣)
  const getEmojiNumber = (n) => {
    if (n === 10) return '🔟'
    const emojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
    return String(n).split('').map(char => emojis[parseInt(char, 10)] || char).join('')
  }

  // Draw 15 unassigned ticket numbers per row randomly
  const handleGenerateRows = (count) => {
    if (tickets.length === 0) {
      alert('Primero debes cargar una base de datos de cartones en la sección superior.')
      return
    }
    
    const qty = parseInt(count, 10)
    if (isNaN(qty) || qty <= 0) return

    // Gather all currently assigned ticket numbers to avoid overlap/clashing
    const assignedNumbers = new Set()
    sellerRows.forEach(row => {
      row.numbers.forEach(num => assignedNumbers.add(String(num)))
    })

    // Filter available tickets
    const availableTickets = tickets.filter(t => !assignedNumbers.has(String(t.ticket_number)))

    if (availableTickets.length < qty * 15) {
      alert(`No hay suficientes cartones disponibles para generar ${qty} filas de 15. Quedan ${availableTickets.length} cartones libres en la base de datos.`)
      return
    }

    // Shuffle and pick
    const shuffled = [...availableTickets].sort(() => 0.5 - Math.random())
    const newRows = []
    let currentIdx = 0

    for (let i = 0; i < qty; i++) {
      const rowNum = sellerRows.length + newRows.length + 1
      const rowNumbers = []
      for (let j = 0; j < 15; j++) {
        rowNumbers.push(shuffled[currentIdx].ticket_number)
        currentIdx++
      }
      newRows.push({
        id: rowNum,
        name: '',
        numbers: rowNumbers
      })
    }

    const updated = [...sellerRows, ...newRows]
    setSellerRows(updated)
    localStorage.setItem('bingo_seller_rows', JSON.stringify(updated))

    // Sync to server
    fetch('/api/save-seller-rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => {
      console.warn('[Sync Error] No se pudo sincronizar las filas con el servidor:', err)
    })
  }

  // Update seller name for a specific row
  const handleUpdateSellerName = (rowId, name) => {
    const updated = sellerRows.map(row => {
      if (row.id === rowId) {
        return { ...row, name }
      }
      return row
    })
    setSellerRows(updated)
    localStorage.setItem('bingo_seller_rows', JSON.stringify(updated))

    // Sync to server
    fetch('/api/save-seller-rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => {
      console.warn('[Sync Error] No se pudo sincronizar el cambio de nombre con el servidor:', err)
    })
  }

  // Clear rows distribution
  const handleResetRows = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar toda la distribución de filas actual? Todos los números volverán a estar disponibles.')) {
      setSellerRows([])
      localStorage.removeItem('bingo_seller_rows')

      // Sync to server
      fetch('/api/save-seller-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      }).catch(err => {
        console.warn('[Sync Error] No se pudo sincronizar el restablecimiento de filas con el servidor:', err)
      })
    }
  }

  // Copy rows structure to clipboard matching WhatsApp format exactly
  const handleCopyRowsToClipboard = () => {
    if (sellerRows.length === 0) return
    
    let text = ''
    sellerRows.forEach(row => {
      const emojiNum = getEmojiNumber(row.id)
      const sellerSuffix = row.name.trim() ? ` - ${row.name.trim()}` : ''
      text += `*Fila ${row.id} ${emojiNum}${sellerSuffix}*\n`
      row.numbers.forEach(num => {
        // Strip leading padding zeros to match "468" instead of "00468"
        text += `${parseInt(num, 10)}\n`
      })
      text += '\n'
    });

    const textToCopy = text.trim()

    // Fallback copy function for non-secure HTTP contexts
    const fallbackCopyText = (val) => {
      const textArea = document.createElement('textarea')
      textArea.value = val
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        const successful = document.execCommand('copy')
        if (successful) {
          alert('¡Distribución de Filas copiada en el formato exacto de WhatsApp! 📋📲')
        } else {
          alert('No se pudo copiar la distribución al portapapeles.')
        }
      } catch (err) {
        alert('Error al copiar al portapapeles: ' + err.message)
      }
      document.body.removeChild(textArea)
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          alert('¡Distribución de Filas copiada en el formato exacto de WhatsApp! 📋📲')
        })
        .catch(() => {
          fallbackCopyText(textToCopy)
        })
    } else {
      fallbackCopyText(textToCopy)
    }
  }

  const totalTickets = tickets.length
  const totalDownloads = downloads.length
  const percentage = totalTickets > 0 ? Math.round((totalDownloads / totalTickets) * 100) : 0

  // Group downloads by day or hour
  const getSalesOverTime = () => {
    if (downloads.length === 0) return []
    
    // Check if dates span more than 24 hours
    const dates = downloads.map(d => new Date(d.downloadedAt).getTime()).filter(t => !isNaN(t))
    if (dates.length === 0) return []
    
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))
    const diffTime = Math.abs(maxDate - minDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const groups = {}
    
    if (diffDays > 1) {
      // Group by Day (DD/MM)
      downloads.forEach(d => {
        if (!d.downloadedAt) return
        const date = new Date(d.downloadedAt)
        if (isNaN(date.getTime())) return
        const label = date.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' })
        groups[label] = (groups[label] || 0) + 1
      })
    } else {
      // Group by Hour (HH:00)
      downloads.forEach(d => {
        if (!d.downloadedAt) return
        const date = new Date(d.downloadedAt)
        if (isNaN(date.getTime())) return
        const label = `${String(date.getHours()).padStart(2, '0')}:00`
        groups[label] = (groups[label] || 0) + 1
      })
    }
    
    return Object.entries(groups).map(([label, value]) => ({ label, value })).sort((a, b) => {
      if (a.label.includes(':') && b.label.includes(':')) {
        return parseInt(a.label) - parseInt(b.label)
      }
      const [dayA, monthA] = a.label.split('/').map(Number)
      const [dayB, monthB] = b.label.split('/').map(Number)
      if (monthA !== monthB) return monthA - monthB
      return dayA - dayB
    })
  }

  // Group downloads by seller name/id
  const getSalesBySeller = () => {
    if (downloads.length === 0) return []
    
    const groups = {}
    downloads.forEach(d => {
      let name = d.sellerName
      if (!name || name === 'Desconocido' || name === 'Sin Nombre') {
        const matchedRow = sellerRows.find(row => 
          row.numbers.some(num => String(parseInt(num, 10)) === String(parseInt(d.ticketNumber, 10)))
        )
        if (matchedRow && matchedRow.name) {
          name = matchedRow.name
        }
      }
      
      const displayName = name && name.trim() ? name.trim() : (d.sellerId ? `+${d.sellerId}` : 'Público')
      groups[displayName] = (groups[displayName] || 0) + 1
    })
    
    return Object.entries(groups)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }

  const salesData = getSalesOverTime()
  const sellerSalesData = getSalesBySeller()
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
                      onClick={handleDownloadJSON}
                      className="flex items-center justify-center gap-2 h-12 px-6 bg-purple-500/20 border border-purple-500/30 text-purple-300 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-purple-500/30 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Descargar JSON Activo
                    </button>
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
            </section>

            {/* ── Sales Performance Chart Section ── */}
            <section className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#221443]/40 pb-4">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#7c7297]">Desempeño de Ventas</h2>
                    <p className="text-[10px] text-[#7c7297]/60 font-semibold mt-0.5">Reporte gráfico de boletos distribuidos</p>
                  </div>
                </div>

                {/* Tabs to switch chart view */}
                {downloads.length > 0 && (
                  <div className="flex bg-[#080214] border border-[#221443] p-1 rounded-xl shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => setActiveChartTab('time')}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeChartTab === 'time'
                          ? 'bg-[#8b5cf6] text-white shadow-sm'
                          : 'text-[#7c7297] hover:text-white'
                      }`}
                    >
                      Por Horas/Días
                    </button>
                    <button
                      onClick={() => setActiveChartTab('seller')}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeChartTab === 'seller'
                          ? 'bg-[#8b5cf6] text-white shadow-sm'
                          : 'text-[#7c7297] hover:text-white'
                      }`}
                    >
                      Por Vendedor
                    </button>
                  </div>
                )}
              </div>

              {downloads.length === 0 ? (
                <div className="text-center py-10 bg-[#180c35]/10 border border-dashed border-[#221443]/40 rounded-3xl">
                  <span className="text-3xl">📊</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mt-3">Sin Historial de Ventas</h3>
                  <p className="text-xs text-[#7c7297] mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Las descargas de cartones que realicen tus vendedores en el Bot de WhatsApp o los clientes en el buscador se reflejarán en este gráfico al instante.
                  </p>
                </div>
              ) : activeChartTab === 'time' ? (
                // 1. TIMELINE CHART (GROUPED BY DAY/HOUR)
                <div className="flex flex-col gap-4">
                  <div className="flex items-end justify-between h-48 pt-6 pb-2 px-4 border-b border-[#221443]/40 relative">
                    {/* Y-axis gridlines */}
                    <div className="absolute left-0 right-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none">
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const maxVal = salesData.length > 0 ? Math.max(...salesData.map(d => d.value)) : 0;
                        return (
                          <div key={i} className="w-full border-t border-[#221443]/20 flex justify-between text-[9px] text-[#7c7297]/60 pt-0.5">
                            <span>{Math.round(maxVal * (1 - ratio))}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Bars */}
                    {salesData.map((d, i) => {
                      const maxVal = salesData.length > 0 ? Math.max(...salesData.map(d => d.value)) : 0;
                      const heightPercent = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 group z-10 h-full justify-end">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 bg-purple-600 text-white text-[10px] font-black py-1 px-2 rounded-lg pointer-events-none shadow-md shadow-purple-900/40">
                            {d.value} {d.value === 1 ? 'cartón' : 'cartones'}
                          </div>
                          {/* Bar Container */}
                          <div className="h-32 w-full flex items-end justify-center relative">
                            {/* Bar */}
                            <div 
                              style={{ height: `${Math.max(6, heightPercent)}%` }} 
                              className="w-7 sm:w-9 rounded-t-lg bg-gradient-to-t from-indigo-600 via-purple-500 to-purple-400 hover:from-indigo-500 hover:via-purple-400 hover:to-purple-300 transition-all duration-300 cursor-pointer shadow-[0_0_12px_rgba(139,92,246,0.15)] group-hover:shadow-[0_0_16px_rgba(139,92,246,0.3)] relative"
                            >
                              <div className="absolute inset-0 bg-white/5 rounded-t-lg pointer-events-none" />
                            </div>
                          </div>
                          {/* X Label */}
                          <span className="text-[10px] text-[#7c7297] font-bold mt-2 truncate max-w-[50px]">{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-[#7c7297]/60 italic text-center">
                    Muestra el volumen de cartones entregados/descargados agrupados en la escala de tiempo activa.
                  </div>
                </div>
              ) : (
                // 2. SELLER PERFORMANCE CHART (RANKING)
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3.5 max-h-[260px] overflow-y-auto pr-1">
                    {sellerSalesData.map((d, i) => {
                      const maxSellerVal = sellerSalesData[0]?.value || 1;
                      const widthPercent = (d.value / maxSellerVal) * 100;
                      return (
                        <div key={i} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#180c35] border border-[#221443] text-purple-400 text-[9px] flex items-center justify-center font-black">
                                {i + 1}
                              </span>
                              {d.label}
                            </span>
                            <span className="font-bold text-amber-400 font-mono text-xs">{d.value} {d.value === 1 ? 'cartón' : 'cartones'}</span>
                          </div>
                          <div className="w-full h-3 bg-[#080214] border border-[#221443]/60 rounded-full overflow-hidden relative">
                            <div 
                              style={{ width: `${widthPercent}%` }}
                              className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-purple-400 rounded-full transition-all duration-500 relative"
                            >
                              <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-[#7c7297]/60 italic text-center">
                    Ranking de vendedores ordenado por mayor cantidad de cartones descargados en el bot.
                  </div>
                </div>
              )}
            </section>

            {/* ── Seller Rows Generator Section ── */}
            <section className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#221443]/40 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#7c7297]">Distribución de Filas (Vendedores)</h2>
                </div>
                {sellerRows.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyRowsToClipboard}
                      className="flex items-center gap-2 h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-purple-600/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Copiar Formato WhatsApp
                    </button>
                    <button
                      onClick={handleResetRows}
                      className="flex items-center gap-2 h-9 px-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-red-400 font-black text-xs uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Restablecer
                    </button>
                  </div>
                )}
              </div>

              {/* Status bar / Summary pool info */}
              <div className="bg-[#180c35]/40 border border-[#221443]/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7c7297]">Estado de la Distribución</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white font-bold">
                      {sellerRows.reduce((acc, r) => acc + r.numbers.length, 0)} asignados
                    </span>
                    <span className="text-[#221443]">•</span>
                    <span className="text-xs text-amber-400 font-bold">
                      {tickets.length - sellerRows.reduce((acc, r) => acc + r.numbers.length, 0)} libres
                    </span>
                    <span className="text-[#221443]">•</span>
                    <span className="text-xs text-purple-400 font-bold font-mono">
                      {sellerRows.length} filas creadas
                    </span>
                  </div>
                </div>

                {/* Generator controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-[#080214] border border-[#221443] rounded-xl px-2 h-10 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7c7297] mr-2">Filas:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={numRowsToGen}
                      onChange={(e) => setNumRowsToGen(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-12 bg-transparent text-white font-bold text-center focus:outline-none text-xs font-mono"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerateRows(numRowsToGen)}
                    className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer shrink-0"
                  >
                    Generar Filas
                  </button>
                </div>
              </div>

              {/* Rows List */}
              {sellerRows.length === 0 ? (
                <div className="text-center py-10 bg-[#180c35]/10 border border-dashed border-[#221443]/40 rounded-3xl">
                  <span className="text-3xl">🗳️</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mt-3">Sin Filas Asignadas</h3>
                  <p className="text-xs text-[#7c7297] mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Genera bloques de 15 cartones aleatorios únicos para entregar a tus vendedores. Las filas son completamente exclusivas y no compartirán números entre sí.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                  {sellerRows.map((row) => (
                    <div
                      key={row.id}
                      className="bg-[#180c35]/30 border border-[#221443]/40 rounded-2xl p-4 flex flex-col gap-3.5 hover:border-purple-500/20 transition-all hover:bg-[#180c35]/40"
                    >
                      {/* Row Header */}
                      <div className="flex justify-between items-center border-b border-[#221443]/30 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black uppercase text-amber-400 font-mono">Fila {getEmojiNumber(row.id)}</span>
                          <span className="text-[9px] font-bold text-[#7c7297] bg-[#180c35] border border-[#221443] px-1.5 py-0.5 rounded-md">
                            {row.numbers.filter(num => !downloads.some(d => String(parseInt(d.ticketNumber, 10)) === String(parseInt(num, 10)))).length} faltan
                          </span>
                        </div>
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleUpdateSellerName(row.id, e.target.value)}
                          placeholder="Nombre Vendedor (ej: Mary)"
                          className="h-7 w-44 bg-[#080214]/60 border border-[#221443] rounded-lg px-2 text-[10px] font-bold text-white placeholder:text-[#7c7297]/30 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                      </div>

                      {/* Number list display */}
                      <div className="flex flex-wrap gap-1.5">
                        {row.numbers.map((num) => {
                          const isSold = downloads.some(d => String(parseInt(d.ticketNumber, 10)) === String(parseInt(num, 10)));
                          return (
                            <span
                              key={num}
                              className={`px-2 py-0.5 rounded-lg font-bold font-mono text-[10px] tracking-wider transition-all duration-300 ${
                                isSold
                                  ? 'bg-red-500/10 border border-red-500/20 text-[#7c7297]/40 line-through decoration-red-500/60'
                                  : 'bg-[#8b5cf6]/5 border border-[#8b5cf6]/10 text-white'
                              }`}
                            >
                              {parseInt(num, 10)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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
                        <th className="py-3 px-3">ID Vendedor</th>
                        <th className="py-3 px-3">Nombre Vendedor</th>
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
                        
                        let sellerId = d.sellerId;
                        let sellerName = d.sellerName;
                        
                        if (!sellerId || !sellerName || sellerName === 'Desconocido' || sellerName === 'Sin Nombre') {
                          const matchedRow = sellerRows.find(row => 
                            row.numbers.some(num => String(parseInt(num, 10)) === String(parseInt(d.ticketNumber, 10)))
                          );
                          if (matchedRow && matchedRow.name) {
                            sellerName = matchedRow.name;
                            const matchedAuth = authorizedIds.find(auth => 
                              auth.name && auth.name.toLowerCase().trim() === matchedRow.name.toLowerCase().trim()
                            );
                            if (matchedAuth) {
                              sellerId = matchedAuth.id;
                            }
                          }
                        }

                        return (
                          <tr key={i} className="border-b border-[#221443]/20 hover:bg-[#180c35]/30 transition-colors">
                            <td className="py-3 px-3 text-[#7c7297] font-bold font-mono">{(downloads.length - i).toString().padStart(3, '0')}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-3 py-1 rounded-lg text-amber-400 font-black font-mono tracking-widest text-xs">
                                  <Hash className="w-3 h-3 text-[#8b5cf6]" />
                                  {d.ticketNumber}
                                </span>
                                {d.isGift && (
                                  <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                    🎁 Regalo
                                  </span>
                                )}
                              </div>
                            </td>
                             <td className="py-3 px-3 text-white font-semibold font-mono text-xs">
                               {sellerId ? (
                                 String(sellerId).split(/[\n,\s;]+/).map(x => x.trim()).filter(Boolean).map(num => `+${num}`).join(', ')
                               ) : (
                                 <span className="text-[#7c7297]/50 italic">Desconocido</span>
                               )}
                             </td>
                            <td className="py-3 px-3">
                              {sellerName ? (
                                <span className="inline-block bg-primary/10 border border-primary/20 text-yellow-400 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                                  {sellerName}
                                </span>
                              ) : (
                                <span className="text-[#7c7297]/50 italic text-xs">Desconocido</span>
                              )}
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

            {/* Player Habilitation Panel */}
            <div className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-[#221443]/30 pb-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#7c7297]">Habilitación de Vendedores (Bot)</h2>
              </div>
              
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#7c7297] leading-relaxed">
                  Registra un vendedor con su número de WhatsApp (ID) para habilitar el bot de descargas. Los campos de Nombre, Celular y CI son 100% opcionales.
                </p>
                
                {/* Form fields */}
                <div className="flex flex-col gap-2 bg-[#180c35]/20 border border-[#221443]/40 p-3.5 rounded-2xl">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-[#7c7297] block mb-1">ID WhatsApp (Obligatorio)</label>
                    <textarea
                      value={newIdInput}
                      onChange={(e) => setNewIdInput(e.target.value)}
                      placeholder="Ej:&#10;59178240880&#10;59177112233"
                      rows={2}
                      className="w-full bg-[#080214]/60 border border-[#221443] rounded-xl px-3 py-2 text-xs font-bold text-white placeholder:text-[#7c7297]/30 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-mono resize-y min-h-[54px]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#7c7297] block mb-1">Nombre</label>
                      <input
                        type="text"
                        value={newSellerName}
                        onChange={(e) => setNewSellerName(e.target.value)}
                        placeholder="Opcional"
                        className="w-full h-8 bg-[#080214]/60 border border-[#221443] rounded-lg px-2 text-[10px] font-bold text-white placeholder:text-[#7c7297]/20 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#7c7297] block mb-1">Celular</label>
                      <input
                        type="text"
                        value={newSellerCell}
                        onChange={(e) => setNewSellerCell(e.target.value)}
                        placeholder="Opcional"
                        className="w-full h-8 bg-[#080214]/60 border border-[#221443] rounded-lg px-2 text-[10px] font-bold text-white placeholder:text-[#7c7297]/20 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#7c7297] block mb-1">C.I.</label>
                      <input
                        type="text"
                        value={newSellerCI}
                        onChange={(e) => setNewSellerCI(e.target.value)}
                        placeholder="Opcional"
                        className="w-full h-8 bg-[#080214]/60 border border-[#221443] rounded-lg px-2 text-[10px] font-bold text-white placeholder:text-[#7c7297]/20 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleEnableId(newIdInput)}
                    className="w-full h-9 mt-1.5 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-600/15 cursor-pointer"
                  >
                    Registrar y Habilitar
                  </button>
                </div>
              </div>

              {/* Sellers List area */}
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-[#7c7297]">
                  <span>Lista de Habilitados</span>
                  <span className="font-mono text-purple-400">({authorizedIds.length})</span>
                </div>
                
                {authorizedIds.length === 0 ? (
                  <div className="text-center py-6 bg-[#180c35]/20 border border-dashed border-[#221443] rounded-xl">
                    <p className="text-[#7c7297]/50 text-[10px] font-black uppercase tracking-wider">Ninguno Habilitado</p>
                    <p className="text-[#7c7297]/30 text-[9px] mt-0.5">El bot no entregará cartones a nadie hasta registrar un vendedor.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {authorizedIds.map((seller) => {
                      const sId = typeof seller === 'object' && seller !== null ? seller.id : seller
                      const sName = typeof seller === 'object' && seller !== null ? seller.name : ''
                      const sCell = typeof seller === 'object' && seller !== null ? seller.cellphone : ''
                      const sCI = typeof seller === 'object' && seller !== null ? seller.ci : ''
                      
                      const isEditing = editingSellerId === sId

                      if (isEditing) {
                        return (
                          <div key={sId} className="bg-[#180c35]/50 border border-purple-500/30 rounded-2xl p-3.5 flex flex-col gap-3.5 animate-slide-in">
                            <div className="flex justify-between items-center border-b border-[#221443]/30 pb-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 font-mono">Editar +{sId}</span>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <div>
                                <label className="text-[9px] font-black uppercase tracking-wider text-[#7c7297] block mb-0.5">Nombre</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full h-7 bg-[#080214]/60 border border-[#221443] rounded-lg px-2 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-black uppercase tracking-wider text-[#7c7297] block mb-0.5">Celular</label>
                                  <input
                                    type="text"
                                    value={editCell}
                                    onChange={(e) => setEditCell(e.target.value)}
                                    className="w-full h-7 bg-[#080214]/60 border border-[#221443] rounded-lg px-2 text-[10px] font-mono text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase tracking-wider text-[#7c7297] block mb-0.5">C.I.</label>
                                  <input
                                    type="text"
                                    value={editCI}
                                    onChange={(e) => setEditCI(e.target.value)}
                                    className="w-full h-7 bg-[#080214]/60 border border-[#221443] rounded-lg px-2 text-[10px] font-mono text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(sId)}
                                className="flex-1 h-7.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Guardar
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex-1 h-7.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-black text-[10px] uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={sId} className="bg-[#180c35]/30 border border-[#221443]/40 rounded-2xl p-3 flex flex-col gap-2 hover:bg-[#180c35]/40 transition-all relative group">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              {sName ? (
                                <span className="text-xs font-black uppercase text-amber-400 tracking-wide">{sName}</span>
                              ) : (
                                <span className="text-xs font-black uppercase text-[#7c7297] italic tracking-wide">Sin Nombre</span>
                              )}
                              {String(sId || '').split(/[\n,\s;]+/).map(x => x.trim()).filter(Boolean).map(num => (
                                <span key={num} className="font-mono text-[10px] text-purple-300 font-bold tracking-wider mt-0.5 block">+{num}</span>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => startEditing(seller)}
                                className="p-1 hover:bg-purple-500/10 text-[#7c7297] hover:text-purple-400 rounded-lg transition-all cursor-pointer"
                                title="Editar Datos"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDisableId(sId)}
                                className="p-1 hover:bg-red-500/10 text-[#7c7297] hover:text-red-400 rounded-lg transition-all cursor-pointer"
                                title="Deshabilitar Vendedor"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {(sCell || sCI) && (
                            <div className="flex gap-4 border-t border-[#221443]/30 pt-1.5 mt-0.5 text-[9px] text-[#7c7297] font-semibold font-mono">
                              {sCell && (
                                <span className="flex items-center gap-1">
                                  <span className="text-purple-400">Cel:</span> {sCell}
                                </span>
                              )}
                              {sCI && (
                                <span className="flex items-center gap-1">
                                  <span className="text-purple-400">CI:</span> {sCI}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
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
