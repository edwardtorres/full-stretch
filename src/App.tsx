import { useEffect, useMemo, useRef, useState } from 'react'
import { Menu as MenuIcon, MoveUpRight } from 'lucide-react'
import { Menu } from './components/Menu'
import type { Destination } from './components/Menu'
import { Dashboard } from './components/Dashboard'
import { SessionPage } from './components/session/SessionPage'
import { Onboarding } from './components/profile/Onboarding'
import { BaselinePage } from './components/profile/BaselinePage'
import { SettingsPage } from './components/profile/SettingsPage'
import { ProgressPage } from './components/progress/ProgressPage'
import { HistoryDetail } from './components/progress/HistoryDetail'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useStretchStore } from './hooks/useStretchStore'
import { todayCompletedStretchIds, todayCoveredRegions } from './lib/history'
import { localDayKey } from './lib/dates'
import type { SessionState } from './lib/session'
export default function App() {
  const store = useStretchStore()
  const [page, setPage] = useState<Destination | 'session' | 'history-detail'>('dashboard')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingStart, setPendingStart] = useState<{ ids: string[]; kind: SessionState['kind'] } | null>(null)
  const [day, setDay] = useState(() => localDayKey(new Date()))
  const menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const refresh = () => setDay(localDayKey(new Date()))
    const interval = setInterval(refresh, 60000)
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  const completed = useMemo(() => todayCoveredRegions(store.history, new Date()), [store.history, day])
  const completeIds = useMemo(() => todayCompletedStretchIds(store.history, new Date()), [store.history, day])
  const closeMenu = () => { setMenuOpen(false); setTimeout(() => menuButton.current?.focus(), 0) }
  const navigate = (destination: Destination) => {
    if (store.active?.phase === 'holding') store.dispatch({ type: 'PAUSE', now: Date.now() })
    setMenuOpen(false); setPage(destination); window.scrollTo({ top: 0 })
  }
  const launch = (ids: string[], kind: SessionState['kind']) => { store.start(ids, kind); setPage('session'); window.scrollTo({ top: 0 }) }
  const start = (ids: string[], kind: SessionState['kind']) => {
    if (store.active && store.active.phase !== 'complete') setPendingStart({ ids, kind })
    else launch(ids, kind)
  }
  const resume = () => { store.resume(); setPage('session'); window.scrollTo({ top: 0 }) }
  const detail = store.history.find(entry => entry.id === detailId)
  const setup = !store.profile.onboarding.completed
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="topbar"><a className="brand" href="#main" onClick={event => { event.preventDefault(); navigate('dashboard') }} aria-label="Full Stretch"><span className="brand-mark" aria-hidden="true"><MoveUpRight size={22} /></span>FULL <span>STRETCH</span></a><span className="topbar-subtitle">Mobility & flexibility</span>
      {setup ? <span className="mini-label">Setup</span> : <button ref={menuButton} className="menu-button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><MenuIcon size={18} /><span>Menu</span></button>}
    </header>
    {!!store.notices.length && <div className="storage-notice" role="alert"><strong>Storage notice</strong>{store.notices.map(message => <p key={message}>{message}</p>)}</div>}
    {setup ? <Onboarding initial={store.profile} onComplete={document => { store.saveProfile(document); setPage('dashboard') }} />
      : page === 'session' && store.active ? <SessionPage state={store.active} dispatch={store.dispatch} onExit={() => navigate('dashboard')} />
      : page === 'progress' ? <ProgressPage history={store.history} baseline={store.profile.profile.baseline} onDetail={entry => { setDetailId(entry.id); setPage('history-detail') }} onBack={() => navigate('dashboard')} onBaseline={() => navigate('baseline')} />
      : page === 'history-detail' && detail ? <HistoryDetail entry={detail} onBack={() => navigate('progress')} />
      : page === 'baseline' ? <BaselinePage document={store.profile} onSave={store.saveProfile} onBack={() => navigate('dashboard')} />
      : page === 'settings' ? <SettingsPage document={store.profile} onSave={store.saveProfile} onReset={() => { const result = store.reset(); if (result.ok) setPage('dashboard'); return result.ok }} onBack={() => navigate('dashboard')} />
      : <Dashboard completed={completed} completeIds={completeIds} preferences={store.profile.profile.preferences} active={store.active} onStart={start} onContinue={resume} />}
    <footer className="footer"><span>FULL STRETCH</span><span>Space to move. Time to breathe.</span></footer>
    {menuOpen && <Menu onClose={closeMenu} onNavigate={navigate} />}
    {pendingStart && <ConfirmDialog title="You have a stretch in progress." onClose={() => setPendingStart(null)}><p>Continue your current session, or discard its unfinished results and start a new one.</p><div className="confirm-actions"><button className="primary-button" onClick={() => { setPendingStart(null); resume() }}>Continue current</button><button className="outline-button" onClick={() => { const next = pendingStart; setPendingStart(null); store.discard(); launch(next.ids, next.kind) }}>Discard and start new</button></div></ConfirmDialog>}
  </div>
}
