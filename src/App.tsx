import { useCallback, useRef, useState } from 'react'
import { ArrowRight, Check, Menu as MenuIcon, MoveUpRight } from 'lucide-react'
import { BodyMap } from './components/BodyMap'
import { Menu } from './components/Menu'
import { StretchGuide } from './components/StretchGuide'
import { SessionPage } from './components/session/SessionPage'
import { regionGroups, regions } from './data/regions'
import { fullBodySequence, plannedHoldSeconds, prescription, stretchesForRegion } from './lib/stretch'
import type { BodyView, RegionId } from './types/stretch'
export default function App() {
  const [selected, setSelected] = useState<RegionId | null>(null)
  const [view, setView] = useState<BodyView>('front')
  const [stretchIndex, setStretchIndex] = useState(0)
  const [completed, setCompleted] = useState<ReadonlySet<RegionId>>(new Set())
  const [session, setSession] = useState<{ ids: string[]; kind: 'targeted' | 'full-body'; key: number } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const selectionTitle = useRef<HTMLHeadingElement>(null)
  const startButton = useRef<HTMLButtonElement>(null)
  const choices = selected ? stretchesForRegion(selected) : []
  const stretch = choices[stretchIndex] ?? choices[0]
  const select = (id: RegionId) => { setSelected(id); setStretchIndex(0); setGuideOpen(false); setView(regions[id].view) }
  const closeMenu = () => { setMenuOpen(false); setTimeout(() => menuButton.current?.focus(), 0) }
  const updateCompleted = useCallback((ids: ReadonlySet<RegionId>) => {
    setCompleted(previous => [...ids].every(id => previous.has(id)) ? previous : new Set([...previous, ...ids]))
  }, [])
  const exit = () => { setSession(null); setTimeout(() => startButton.current?.focus(), 0) }
  const start = (kind: 'targeted' | 'full-body') => {
    const ids = kind === 'full-body' ? fullBodySequence().map(item => item.id) : stretch ? [stretch.id] : []
    if (ids.length) { setSession({ ids, kind, key: Date.now() }); window.scrollTo({ top: 0 }) }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="topbar"><a className="brand" href="#main" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'instant' }) }} aria-label="Full Stretch"><span className="brand-mark" aria-hidden="true"><MoveUpRight size={22} /></span>FULL <span>STRETCH</span></a>
      <span className="topbar-subtitle">Mobility & flexibility</span>
      <button ref={menuButton} className="menu-button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><MenuIcon size={18} /><span>Menu</span></button>
    </header>
    {session ? <SessionPage key={session.key} ids={session.ids} kind={session.kind} pageCompleted={completed} onRegionsComplete={updateCompleted} onExit={exit} /> : <main id="main" tabIndex={-1}>
      <div className="dashboard-heading"><div><p className="eyebrow">A moment for movement</p><h1>Make room<br />to <em>move.</em></h1></div><p>Choose a region.<br />Find your stretch.</p></div>
      <div className="dashboard-layout"><div className="anatomy-column"><BodyMap view={view} setView={setView} selected={selected} completed={completed} onSelect={select} /></div>
        <aside className="stretch-panel" aria-label="Selected stretch">
          {selected && stretch ? <div className="selected-stretch"><div className="panel-kicker"><span className="eyebrow">Your focus</span><span className="mini-label">{completed.has(selected) ? <><Check size={13} /> Complete</> : 'Ready'}</span></div>
            <h2 ref={selectionTitle} tabIndex={-1}>{regions[selected].label}</h2>
            {choices.length > 1 ? <label className="stretch-picker">Stretch<select value={stretch.id} onChange={event => { setStretchIndex(choices.findIndex(item => item.id === event.target.value)); setGuideOpen(false) }}>{choices.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label> : <h3>{stretch.name}</h3>}
            <p className="prescription">{prescription(stretch)}</p>
            <button className="primary-button" ref={startButton} onClick={() => start('targeted')}>Start stretch<ArrowRight size={18} /></button>
            <details className="preview-guide" open={guideOpen} onToggle={event => setGuideOpen(event.currentTarget.open)}><summary>How to stretch</summary><StretchGuide stretch={stretch} /></details>
          </div> : <div className="empty-selection"><span className="empty-orbit" aria-hidden="true"><MoveUpRight size={28} /></span><h2>Where would you<br />like to start?</h2><p>Select a muscle to see its stretch.</p></div>}
          <div className="full-body-cta"><div className="routine-line"><span className="eyebrow">From head to toe</span><span className="mini-label">12 stretches</span></div><p>{Math.round(plannedHoldSeconds(fullBodySequence()) / 60)} min hold time · Move at your pace.</p><button className="outline-button" ref={selected ? undefined : startButton} onClick={() => start('full-body')}>Start full body stretch<ArrowRight size={17} /></button></div>
        </aside>
      </div>
      <section className="region-index" aria-labelledby="region-title"><div className="region-index-heading"><h2 id="region-title">Choose your region</h2><span>{completed.size} / 13 complete</span></div><div className="region-groups">{regionGroups.map(group => <div className="region-group" key={group.label}><h3>{group.label}</h3><div className="region-buttons">{group.ids.map((id, index) => <button type="button" className={`region-button ${completed.has(id) ? 'is-complete' : ''}`} key={id} aria-pressed={selected === id} aria-label={`${regions[id].label}${completed.has(id) ? ', complete' : ''}`} onClick={() => { select(id); setTimeout(() => { if (window.innerWidth < 700) selectionTitle.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); selectionTitle.current?.focus({ preventScroll: true }) }, 0) }}><span className="region-number" aria-hidden="true">{(index + 1).toString().padStart(2, '0')}</span><span>{regions[id].shortLabel ?? regions[id].label}</span>{completed.has(id) ? <Check size={15} /> : <ArrowRight size={15} aria-hidden="true" />}</button>)}</div></div>)}</div></section>
      <p className="dashboard-note">Warm up first. Hold steady, breathe normally, and stay in a comfortable range.</p>
    </main>}
    <footer className="footer"><span>FULL STRETCH</span><span>Space to move. Time to breathe.</span></footer>
    {menuOpen && <Menu onClose={closeMenu} onDashboard={() => { closeMenu(); if (session) exit() }} />}
  </div>
}
