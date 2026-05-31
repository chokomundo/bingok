import { useState, useEffect, useRef } from 'react'
import './landing.css'
import heroBanner from './assets/solibingo_hero.png'

const DRAWS = [
  { id:'BS-031', date:'08 May 2026', price:3, prize:1850, pattern:'Cartón Lleno', winner:'#1042', players:620 },
  { id:'BS-030', date:'01 May 2026', price:5, prize:2400, pattern:'Cartón Lleno', winner:'#0387', players:510 },
  { id:'BS-028', date:'17 Abr 2026', price:5, prize:2100, pattern:'Cartón Lleno', winner:'#1203', players:450 },
  { id:'BS-025', date:'27 Mar 2026', price:3, prize:1750, pattern:'Cartón Lleno', winner:'#0847', players:445 },
  { id:'BS-021', date:'06 Mar 2026', price:5, prize:2250, pattern:'Cartón Lleno', winner:'#0563', players:480 },
  { id:'BS-018', date:'13 Feb 2026', price:3, prize:1550, pattern:'Cartón Lleno', winner:'#0219', players:390 },
  { id:'BS-014', date:'16 Ene 2026', price:5, prize:2050, pattern:'Cartón Lleno', winner:'#0731', players:420 },
  { id:'BS-010', date:'19 Dic 2025', price:3, prize:1400, pattern:'Cartón Lleno', winner:'#0088', players:360 },
]

const GROUPS = [
  { name:'Solibingo Principal 🎱', region:'Grupo Central',  cap:'120/120', full:true,  link:'https://wa.me/59170000001' },
  { name:'Solibingo Norte 💛',     region:'Zona Norte',     cap:'87/120',  full:false, link:'https://wa.me/59170000002' },
  { name:'Solibingo Sur ❤️',       region:'Zona Sur',       cap:'105/120', full:false, link:'https://wa.me/59170000003' },
  { name:'Solibingo Este 💙',      region:'Zona Este',      cap:'43/120',  full:false, link:'https://wa.me/59170000004' },
  { name:'Solibingo Oeste 💚',     region:'Zona Oeste',     cap:'98/120',  full:false, link:'https://wa.me/59170000005' },
  { name:'Solibingo VIP ⭐',       region:'Exclusivo 5 Bs', cap:'60/80',   full:false, link:'https://wa.me/59170000006' },
]

const VALUES = [
  { icon:'❤️', title:'Solidaridad', desc:'Ayudamos a quienes más lo necesitan.' },
  { icon:'🤝', title:'Comunidad',   desc:'Nos unimos para generar un impacto positivo.' },
  { icon:'🎁', title:'Premios',     desc:'Jugá, divertite y ganá increíbles premios.' },
  { icon:'💙', title:'Empatía',     desc:'Cada número es una esperanza que suma.' },
]

const TABS = [
  { id:'inicio',  label:'Inicio',    icon:'🏠' },
  { id:'sorteos', label:'Sorteos',   icon:'🏆' },
  { id:'grupos',  label:'Grupos WA', icon:'📲' },
  { id:'jugar',   label:'Cómo jugar',icon:'ℹ️'  },
]

function nextSat() {
  const now = new Date(); const d = now.getDay()
  const diff = d === 6 ? 7 : 6 - d
  const sat = new Date(now); sat.setDate(now.getDate() + diff); sat.setHours(19,0,0,0)
  return sat
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('inicio')
  const [tabHidden, setTabHidden]  = useState(false)
  const [cd, setCd]   = useState({ d:0,h:0,m:0,s:0 })
  const [counts, setCounts] = useState({ draws:0,tickets:0,prizes:0,families:0 })
  const counted = useRef(false)

  // Refs for each section
  const refs = {
    inicio:  useRef(null),
    sorteos: useRef(null),
    grupos:  useRef(null),
    jugar:   useRef(null),
  }

  // Countdown
  useEffect(() => {
    const tick = () => {
      const diff = nextSat() - Date.now(); if (diff <= 0) return
      setCd({ d:Math.floor(diff/86400000), h:Math.floor((diff%86400000)/3600000), m:Math.floor((diff%3600000)/60000), s:Math.floor((diff%60000)/1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  // Counter animation (once)
  useEffect(() => {
    if (counted.current) return; counted.current = true
    const targets = { draws:31, tickets:14200, prizes:42000, families:3800 }
    let step = 0; const steps = 50
    const id = setInterval(() => {
      step++; const p = step / steps
      setCounts({ draws:Math.floor(targets.draws*p), tickets:Math.floor(targets.tickets*p), prizes:Math.floor(targets.prizes*p), families:Math.floor(targets.families*p) })
      if (step >= steps) clearInterval(id)
    }, 30)
    return () => clearInterval(id)
  }, [])

  // Scroll-spy: update active tab based on visible section
  useEffect(() => {
    const observers = []
    Object.entries(refs).forEach(([id, ref]) => {
      if (!ref.current) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveTab(id) },
        { threshold: 0.4 }
      )
      obs.observe(ref.current)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  // Auto-hide tab bar on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setTabHidden(y > lastY && y > 80)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Click tab → smooth scroll to section
  const goTo = (id) => {
    refs[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveTab(id)
  }

  return (
    <div className="sb">
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── STICKY NAV ─────────────────────────────────── */}
      <nav className="sb-nav">
        <div className="sb-logo"><span>soli</span><span>bingo</span></div>
        <div className="sb-tabs-desktop">
          {TABS.map(t => (
            <button key={t.id} className={`sb-tab-btn ${activeTab===t.id?'active':''}`} onClick={() => goTo(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="sb-nav-actions">
          <a href="#/buscar" className="sb-search-btn">🔍 Busca tu Cartón</a>
          <a href="#/hub" className="sb-admin-btn">🔐 Entrar</a>
        </div>
      </nav>

      {/* ══ SECTION 1: INICIO ══════════════════════════════ */}
      <section ref={refs.inicio} id="inicio" className="sb-section p1">
        <div className="p1-hero">
          <img src={heroBanner} alt="Solibingo — Un Bingo, Muchas Manos, Grandes Cambios" />
          <div className="p1-badge">
            <span className="lbl">🎟️ Desde</span>
            <span className="bs">3 Bs</span>
            <span className="sep">|</span>
            <span className="prz">🏆 Premios +1.000 Bs</span>
          </div>
        </div>
        <div className="p1-stats">
          <div className="p1-stat"><div className="p1-stat-val">{counts.draws}+</div><div className="p1-stat-lbl">Sorteos</div></div>
          <div className="p1-stat"><div className="p1-stat-val">{counts.tickets.toLocaleString()}+</div><div className="p1-stat-lbl">Cartones</div></div>
          <div className="p1-stat"><div className="p1-stat-val">Bs {counts.prizes.toLocaleString()}+</div><div className="p1-stat-lbl">En premios</div></div>
          <div className="p1-stat"><div className="p1-stat-val">{counts.families.toLocaleString()}+</div><div className="p1-stat-lbl">Familias</div></div>
        </div>
        <div className="p1-values">
          {VALUES.map((v,i) => (
            <div key={i} className="p1-val">
              <div className="p1-val-icon">{v.icon}</div>
              <div className="p1-val-title">{v.title}</div>
              <p className="p1-val-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SECTION 2: SORTEOS ═════════════════════════════ */}
      <section ref={refs.sorteos} id="sorteos" className="sb-section p2">
        <div className="p2-header">
          <h2>🏆 Ganadores de Cartón Lleno</h2>
          <p>Historial oficial de premios máximos — sorteo completo</p>
        </div>
        <div className="p2-table-wrap">
          <table className="sb-table">
            <thead>
              <tr>{['Sorteo','Fecha','Precio','Premio 🏆','Ganador','Jugadores'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {DRAWS.map((d,i) => (
                <tr key={i}>
                  <td><span className="t-id">{d.id}</span></td>
                  <td style={{color:'#555',fontWeight:700,fontSize:12}}>{d.date}</td>
                  <td><span className="t-price">Bs {d.price}</span></td>
                  <td><span className="t-prize">Bs {d.prize.toLocaleString()}</span></td>
                  <td><span className="t-winner">Tkto {d.winner}</span></td>
                  <td style={{color:'#aaa',fontWeight:700,fontSize:12}}>{d.players.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══ SECTION 3: GRUPOS WA ═══════════════════════════ */}
      <section ref={refs.grupos} id="grupos" className="sb-section p3">
        <div className="p3-header">
          <h2>Grupos de WhatsApp Autorizados</h2>
          <p>Únete a un grupo oficial y compra tu cartón de forma segura ✅</p>
        </div>
        <div className="p3-grid">
          {GROUPS.map((g,i) => (
            g.full
              ? <div key={i} className="p3-card full">
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:22}}>🔒</span>
                    <div><div className="p3-name">{g.name}</div><div className="p3-sub">{g.region} · {g.cap}</div></div>
                  </div>
                  <div className="p3-badge lleno">Lleno</div>
                </div>
              : <a key={i} href={g.link} target="_blank" rel="noopener noreferrer" className={`p3-card ${i<3?'p3-pulse':''}`}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:22}}>📲</span>
                    <div><div className="p3-name">{g.name}</div><div className="p3-sub">{g.region} · {g.cap}</div></div>
                  </div>
                  <div className="p3-badge act">Unirse →</div>
                </a>
          ))}
        </div>
        <p className="p3-warn">⚠️ Solo compra en grupos verificados. Desconfía de grupos no oficiales.</p>
      </section>

      {/* ══ SECTION 4: CÓMO JUGAR ══════════════════════════ */}
      <section ref={refs.jugar} id="jugar" className="sb-section p4">
        <div style={{color:'rgba(255,255,255,.5)',fontSize:11,fontWeight:800,letterSpacing:'.3em',textTransform:'uppercase',textAlign:'center'}}>Próximo Sorteo #032</div>
        <h2 className="p4-title">¡Faltan para el próximo sorteo!</h2>
        <div className="p4-cd">
          {[['d','Días'],['h','Horas'],['m','Min'],['s','Seg']].map(([k,l]) => (
            <div key={k} className="p4-cd-box">
              <div className="p4-cd-num">{String(cd[k]).padStart(2,'0')}</div>
              <div className="p4-cd-lbl">{l}</div>
            </div>
          ))}
        </div>
        <div className="p4-steps">
          {[
            { icon:'💬',num:'01',title:'Únete al grupo',    desc:'Entra a un grupo de WhatsApp autorizado de la lista oficial.' },
            { icon:'🎟️',num:'02',title:'Compra tu cartón', desc:'Elige cartones a 3 Bs o 5 Bs y realiza tu pago seguro.' },
            { icon:'🏆',num:'03',title:'¡Jugá y ganá!',    desc:'Seguí el sorteo en vivo. Si ganás, te contactamos al instante.' },
          ].map((s,i) => (
            <div key={i} className="p4-step">
              <div className="p4-step-icon">{s.icon}</div>
              <div className="p4-step-num">PASO {s.num}</div>
              <h3 className="p4-step-title">{s.title}</h3>
              <p className="p4-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
        <button className="p4-cta" onClick={() => goTo('grupos')}>
          📲 Ver grupos disponibles ahora
        </button>
      </section>

      {/* ── FLOATING BOTTOM TAB BAR ───────────────────────── */}
      <div className={`sb-tabs-mobile ${tabHidden ? 'hide' : ''}`}>
        <div className="sb-tabs-mobile-inner">
          {TABS.map(t => (
            <button key={t.id} className={`sb-mtab ${activeTab===t.id?'active':''}`} onClick={() => goTo(t.id)}>
              <span className="sb-mtab-icon">{t.icon}</span>
              <span className="sb-mtab-lbl">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
