import { Play, FileJson, Printer, Sparkles, BarChart3 } from 'lucide-react'

export default function Home() {
  const options = [
    {
      title: "Tablero de Presentador",
      description: "Inicia la transmisión en vivo, canta las bolas y verifica ganadores en tiempo real.",
      icon: <Play className="w-10 h-10 text-white translate-x-[2px]" />,
      href: "#/bingo",
      color: "from-blue-500 to-indigo-600",
      shadow: "hover:shadow-[0_10px_40px_rgba(59,130,246,0.2)]",
    },
    {
      title: "Generar Boletos",
      description: "Crea baterías exactas de miles de cartones de Bingo en formato JSON listos para repartir.",
      icon: <FileJson className="w-10 h-10 text-white" />,
      href: "#/generator",
      color: "from-amber-500 to-orange-600",
      shadow: "hover:shadow-[0_10px_40px_rgba(245,158,11,0.2)]",
    },
    {
      title: "Impresora Física",
      description: "Carga tu base de datos y manda a imprimir tus cartones a PDF de manera profesional.",
      icon: <Printer className="w-10 h-10 text-white" />,
      href: "#/print",
      color: "from-emerald-500 to-teal-600",
      shadow: "hover:shadow-[0_10px_40px_rgba(16,185,129,0.2)]",
    },
    {
      title: "Panel de Ventas",
      description: "Gestiona el JSON de cartones, monitorea las descargas y controla la distribución en tiempo real.",
      icon: <BarChart3 className="w-10 h-10 text-white" />,
      href: "#/ventas",
      color: "from-purple-500 to-indigo-600",
      shadow: "hover:shadow-[0_10px_40px_rgba(139,92,246,0.2)]",
    }
  ]

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4 relative">
      <a href="#/" className="absolute top-4 left-4 text-xs font-bold text-text-muted hover:text-white flex items-center gap-1 transition-colors">
        ← Página pública
      </a>
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center space-x-3 bg-surface border border-border/50 px-6 py-2.5 rounded-full mb-2">
             <Sparkles className="w-5 h-5 text-accent animate-pulse" />
             <span className="font-bold text-xs tracking-[0.2em] uppercase bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
               Suite de Operación Central
             </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight flex items-center justify-center gap-4">
            BINGO <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">LIVE</span>
          </h1>
          <p className="text-text-muted text-lg md:text-2xl max-w-2xl mx-auto font-medium">
            El sistema modular definitivo para tu evento en vivo. Selecciona la herramienta que necesitas hoy.
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr mt-12">
          {options.map((opt, idx) => (
            <a key={idx} href={opt.href} className="flex flex-col w-full h-full group outline-none">
               <div className={`relative w-full h-full bg-surface border border-border hover:border-text/30 rounded-3xl p-8 transition-all duration-500 ease-out hover:-translate-y-2 flex flex-col justify-between ${opt.shadow}`}>
                 <div className="mb-4">
                   <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 bg-gradient-to-br ${opt.color} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                     {opt.icon}
                   </div>
                   <h2 className="text-3xl font-black mb-4 leading-tight tracking-tight text-white group-hover:text-accent transition-colors">{opt.title}</h2>
                   <p className="text-text-muted text-lg leading-relaxed">{opt.description}</p>
                 </div>
                 <div className="flex items-center gap-2 pt-6 mt-auto text-sm font-bold text-text-muted group-hover:text-text transition-colors">
                   INICIAR APLICACIÓN
                   <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                 </div>
               </div>
            </a>
          ))}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-20 text-text-muted/40 font-bold tracking-widest text-[10px] uppercase">
            SISTEMA INTEGRAL DE CONTROL • VERSIÓN 3.0 • CÁLCULO ACTIVO
        </div>
      </div>
    </div>
  )
}
