import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Lock, Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react'
import './index.css'
import LandingPage from './LandingPage.jsx'
import Home from './Home.jsx'
import BingoApp from './BingoApp.jsx'
import GeneratorApp from './GeneratorApp.jsx'
import PrintApp from './PrintApp.jsx'
import SearchApp from './SearchApp.jsx'
import SalesPanel from './SalesPanel.jsx'

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === '78240880p') {
      onLogin()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b031e] via-[#080214] to-[#120530] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/20 mb-4 border border-purple-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-black tracking-widest text-[#efeaf6] mb-2 uppercase">BINGO BLACK</h1>
          <p className="text-[#7c7297] text-sm uppercase tracking-widest font-black">Suite de Operación</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0e0524]/60 backdrop-blur-xl border border-[#221443] rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#a78bfa] mb-2.5">
                Contraseña de Administrador
              </label>
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError(false)
                  }}
                  placeholder="••••••••••••"
                  className="w-full h-13 bg-[#180c35]/50 border border-[#221443] rounded-xl pl-4 pr-12 text-lg text-white placeholder:text-[#7c7297]/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all font-mono tracking-widest shadow-inner"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7c7297] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-red-400 font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Contraseña incorrecta. Por favor intente de nuevo.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-[#0f0729] font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/15 hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Acceder a la Suite
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <a
            href="#/"
            className="inline-flex items-center gap-2 text-xs font-black text-[#7c7297] hover:text-white uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la página pública
          </a>
        </div>
      </div>
    </div>
  )
}

function RootApp() {
  const [route, setRoute] = useState(window.location.hash)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('bingo_admin_auth') === 'true'
  })

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Check if route is administrative
  const isAdminRoute = ['#/hub', '#/generator', '#/print', '#/bingo', '#/ventas'].includes(route)

  // Protect administrative routes
  if (isAdminRoute && !isAuthenticated) {
    return (
      <AdminLogin
        onLogin={() => {
          sessionStorage.setItem('bingo_admin_auth', 'true')
          setIsAuthenticated(true)
        }}
      />
    )
  }

  if (route === '#/hub')       return <Home />
  if (route === '#/generator') return <GeneratorApp />
  if (route === '#/print')     return <PrintApp />
  if (route === '#/bingo')     return <BingoApp />
  if (route === '#/buscar')    return <SearchApp />
  if (route === '#/ventas')    return <SalesPanel />
  return <LandingPage />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
