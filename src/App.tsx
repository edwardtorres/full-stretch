import type { ProgramId } from './types/program'
import type { MobilityRoutineId } from './types/mobility'
import { MobilityPage } from './components/mobility/MobilityPage'
import { MobilityDetail } from './components/mobility/MobilityDetail'
import { MobilitySessionPage } from './components/mobility/MobilitySessionPage'
import { MobilityHistoryDetail } from './components/mobility/MobilityHistoryDetail'
import { isFlexibilityHistory, mobilityToday } from './lib/mobilityHistory'
import { ProgramsPage } from './components/programs/ProgramsPage'
import { ProgramDetail } from './components/programs/ProgramDetail'
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
import { sessionEarnedEvents } from './lib/presentation'
import { localDayKey } from './lib/dates'
import { startRequiresResolution } from './lib/sessionLaunch'
type SessionRequest = { ids: string[] } | { programId: ProgramId } | { routineId: MobilityRoutineId }
export default function App() {
  const store = useStretchStore()
  const [page, setPage] = useState<Destination | 'session' | 'mobility-session' | 'history-detail' | 'program-detail' | 'mobility-detail'>('dashboard')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingStart, setPendingStart] = useState<SessionRequest | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<ProgramId>('quick-5')
  const [selectedRoutine, setSelectedRoutine] = useState<MobilityRoutineId>('full-body-warmup')
  const [day, setDay] = useState(() => localDayKey(new Date()))
  const menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const refresh = () => setDay(localDayKey(new Date()))
    const interval = setInterval(refresh, 60000)
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  useEffect(() => { store.ensureWeek() }, [day, store.profile.onboarding.completed, store.profile.profile.weeklySchedule])
  const flexibilityHistory = useMemo(() => store.history.filter(isFlexibilityHistory), [store.history])
  const mobilityHistory = useMemo(() => store.history.filter(entry => entry.activityType === 'mobility'), [store.history])
  const completed = useMemo(() => todayCoveredRegions(flexibilityHistory, new Date()), [flexibilityHistory, day])
  const completeIds = useMemo(() => todayCompletedStretchIds(flexibilityHistory, new Date()), [flexibilityHistory, day])
  const closeMenu = () => { setMenuOpen(false); setTimeout(() => menuButton.current?.focus(), 0) }
  const navigate = (destination: Destination) => {
    if (store.active?.kind === 'mobility' && store.active.phase === 'running') store.dispatchMobility({ type: 'PAUSE', now: Date.now() })
    else if (store.active?.kind !== 'mobility' && store.active?.phase === 'holding') store.dispatch({ type: 'PAUSE', now: Date.now() })
    setMenuOpen(false); setPage(destination); window.scrollTo({ top: 0 })
  }
  const launch = (request: SessionRequest) => { if ('routineId' in request) { store.startMobility(request.routineId); setPage('mobility-session') } else { if ('programId' in request) store.startProgram(request.programId); else store.start(request.ids, 'targeted'); setPage('session') } window.scrollTo({ top: 0 }) }
  const start = (request: SessionRequest) => {
    if (startRequiresResolution(store.active)) setPendingStart(request)
    else launch(request)
  }
  const resume = () => { store.resume(); setPage(store.active?.kind === 'mobility' ? 'mobility-session' : 'session'); window.scrollTo({ top: 0 }) }
  const detail = store.history.find(entry => entry.id === detailId)
  const earnedEvents = store.active?.phase === 'complete' ? sessionEarnedEvents(store.history, store.active.id, store.profile.profile.baseline, store.weeks, new Date()) : []
  const setup = !store.profile.onboarding.completed
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="topbar"><a className="brand" href="#main" onClick={event => { event.preventDefault(); navigate('dashboard') }} aria-label="Full Stretch"><span className="brand-mark" aria-hidden="true"><MoveUpRight size={22} /></span>FULL <span>STRETCH</span></a><span className="topbar-subtitle">Mobility & flexibility</span>
      {setup ? <span className="mini-label">Setup</span> : <button ref={menuButton} className="menu-button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><MenuIcon size={18} /><span>Menu</span></button>}
    </header>
    {!!store.notices.length && <div className="storage-notice" role="alert"><strong>Storage notice</strong>{store.notices.map(message => <p key={message}>{message}</p>)}</div>}
    {setup ? <Onboarding initial={store.profile} onComplete={document => { store.saveProfile(document); setPage('dashboard') }} />
      : page === 'session' && store.active && store.active.kind !== 'mobility' ? <SessionPage earnedEvents={earnedEvents} state={store.active} dispatch={store.dispatch} onExit={() => navigate('dashboard')} />
      : page === 'mobility-session' && store.active?.kind === 'mobility' ? <MobilitySessionPage earnedEvents={earnedEvents} state={store.active} dispatch={store.dispatchMobility} onExit={() => navigate('mobility')} />
      : page === 'programs' ? <ProgramsPage preferences={store.profile.profile.preferences} schedule={store.profile.profile.weeklySchedule} history={flexibilityHistory} today={new Date()} onSelect={id => { setSelectedProgram(id); setPage('program-detail'); window.scrollTo({ top: 0 }) }} onBack={() => navigate('dashboard')} onSettings={() => navigate('settings')} />
      : page === 'program-detail' ? <ProgramDetail programId={selectedProgram} preferences={store.profile.profile.preferences} onStart={programId => start({ programId })} onBack={() => navigate('programs')} />
      : page === 'mobility' ? <MobilityPage onBack={() => navigate('dashboard')} onSelect={id => { setSelectedRoutine(id); setPage('mobility-detail'); window.scrollTo({ top: 0 }) }} />
      : page === 'mobility-detail' ? <MobilityDetail routineId={selectedRoutine} onBack={() => navigate('mobility')} onStart={routineId => start({ routineId })} />
      : page === 'progress'  ? <ProgressPage history={store.history} baseline={store.profile.profile.baseline} schedule={store.profile.profile.weeklySchedule} weeks={store.weeks} today={new Date()} onDetail={entry => { setDetailId(entry.id); setPage('history-detail') }} onBack={() => navigate('dashboard')} onBaseline={() => navigate('baseline')} />
      : page === 'history-detail' && detail ? detail.activityType === 'mobility' ? <MobilityHistoryDetail entry={detail} onBack={() => navigate('progress')} /> : <HistoryDetail entry={detail} onBack={() => navigate('progress')} />
      : page === 'baseline' ? <BaselinePage document={store.profile} onSave={store.saveProfile} onBack={() => navigate('dashboard')} />
      : page === 'settings' ? <SettingsPage document={store.profile} onSave={store.saveProfile} onReset={() => { const result = store.reset(); if (result.ok) setPage('dashboard'); return result.ok }} onBack={() => navigate('dashboard')} />
      : <Dashboard completed={completed} completeIds={completeIds} preferences={store.profile.profile.preferences} active={store.active} onStart={ids => start({ ids })} onContinue={resume} schedule={store.profile.profile.weeklySchedule} history={flexibilityHistory} mobilityHistory={mobilityHistory} mobilityToday={mobilityToday(mobilityHistory, new Date())} weeks={store.weeks} today={new Date()} onPrograms={() => navigate('programs')} onStartProgram={programId => start({ programId })} />}
    <footer className="footer"><span>FULL STRETCH</span><span>Space to move. Time to breathe.</span></footer>
    {menuOpen && <Menu onClose={closeMenu} onNavigate={navigate} />}
    {pendingStart && <ConfirmDialog title="You have a session in progress." onClose={() => setPendingStart(null)}><p>Continue your current session, or discard its unfinished results and start a new one.</p><div className="confirm-actions"><button className="primary-button" onClick={() => { setPendingStart(null); resume() }}>Continue current</button><button className="outline-button" onClick={() => { const next = pendingStart; setPendingStart(null); store.discard(); launch(next) }}>Discard and start new</button></div></ConfirmDialog>}
  </div>
}
