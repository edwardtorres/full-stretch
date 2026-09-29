import { useRef, useState } from 'react'
import { ArrowRight, Check, MoveUpRight } from 'lucide-react'
import { BodyMap } from './BodyMap'
import { StretchGuide } from './StretchGuide'
import { regionGroups, regions } from '../data/regions'
import { getStretch, prescription, stretchesForRegion } from '../lib/stretch'
import { TodayProgram } from './programs/TodayProgram'
import { getProgram } from '../lib/programs'
import type { ProgramId } from '../types/program'
import type { WeeklySchedule } from '../types/schedule'
import type { StretchHistoryEntry } from '../types/history'
import type { StretchPreferences } from '../types/profile'
import type { ActiveSession } from '../lib/storage'
import type { MobilityHistoryEntry } from '../types/history'
import { getMobilityRoutine } from '../data/mobility'
import { flexibilityThisWeek, getCoverageSummary, getMobilityConsistency, getWeekStreaks } from '../lib/analytics'
import type { WeekSnapshot } from '../lib/weekSnapshots'
import type { BodyView, RegionId } from '../types/stretch'
export function Dashboard({ completed, completeIds, preferences, active, onStart, onContinue, schedule, history, mobilityHistory, mobilityToday, weeks, today, onPrograms, onStartProgram }: {
  completed: ReadonlySet<RegionId>; completeIds: ReadonlySet<string>; preferences: StretchPreferences; active: ActiveSession | null; onStart: (ids: string[]) => void; onContinue: () => void; schedule: WeeklySchedule; history: StretchHistoryEntry[]; mobilityHistory: MobilityHistoryEntry[]; mobilityToday: MobilityHistoryEntry[]; weeks: WeekSnapshot[]; today: Date; onPrograms: () => void; onStartProgram: (id: ProgramId) => void
}) {
  const [selected, setSelected] = useState<RegionId | null>(() => active?.kind === 'targeted' ? getStretch(active.ids[0]).primaryRegions[0] : null)
  const [view, setView] = useState<BodyView>(selected ? regions[selected].view : 'front')
  const [stretchIndex, setStretchIndex] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)
  const [bodyMode, setBodyMode] = useState<'today' | 'coverage'>('today')
  const selectionTitle = useRef<HTMLHeadingElement>(null)
  const startButton = useRef<HTMLButtonElement>(null)
  const choices = selected ? stretchesForRegion(selected) : []
  const stretch = choices[stretchIndex] ?? choices[0]
  const select = (id: RegionId) => { setSelected(id); setStretchIndex(0); setGuideOpen(false); setView(regions[id].view) }
  const weekly = flexibilityThisWeek(history, schedule, today)
  const streak = getWeekStreaks(weeks, history, today)
  const mobilityWeek = getMobilityConsistency(mobilityHistory, today)
  const coverage = getCoverageSummary(history, 'recent', today)
  const coverageTones = new Map(coverage.map(item => [item.region, item.label === 'Well Covered' ? 'well' : item.label === 'Less Covered' ? 'less' : 'building'] as const))
  const selectedCoverage = coverage.find(item => item.region === selected)
  return <main id="main" tabIndex={-1}>
      <div className="dashboard-heading"><div><p className="eyebrow">A moment for movement</p><h1>Make room<br />to <em>move.</em></h1></div><p>Choose a region.<br />Find your stretch.</p></div>
      <p className="today-status"><span className="mini-label">Today</span> {completed.size ? `${completed.size} ${completed.size === 1 ? 'region' : 'regions'} stretched` : completeIds.size ? `${completeIds.size} ${completeIds.size === 1 ? 'stretch' : 'stretches'} completed` : 'No stretches completed yet today'}</p>
      <div className="weekly-compact" aria-label="This week"><span className="mini-label">This week</span><strong>{weekly.scheduled.finished} / {weekly.scheduled.scheduled} scheduled flexibility sessions</strong><span>{weekly.regions} regions stretched · {streak.current ? `${streak.current}-week streak` : 'No current week streak'}</span><span>Warm-ups this week: {mobilityWeek.thisWeek}</span>{weekly.scheduled.complete && <em>Complete Week · all scheduled sessions finished</em>}</div>
      {mobilityToday.length > 0 && <p className="mobility-today-status">Warm-up today · {mobilityToday.length === 1 ? `${getMobilityRoutine(mobilityToday[0].routineId).name} finished` : `${mobilityToday.length} warm-ups finished`}</p>}
      {active && active.phase !== 'complete' && <div className={`continue-session ${active.kind === 'mobility' ? 'mobility-continue' : ''}`}><div><strong>{active.kind === 'mobility' ? getMobilityRoutine(active.routineId).name : active.kind === 'program' ? getProgram(active.programId!).name : 'Targeted stretch'}</strong><span>{active.kind === 'mobility' ? `Mobility · movement ${active.movementIndex + 1} of ${active.steps.length}` : active.kind === 'program' ? `Flexibility · stretch ${active.stretchIndex + 1} of ${active.ids.length} · ${regions[getStretch(active.ids[active.stretchIndex]).primaryRegions[0]].label}` : regions[getStretch(active.ids[active.stretchIndex]).primaryRegions[0]].label}</span></div><button className="outline-button" onClick={onContinue}>Continue {active.kind === 'mobility' ? 'warm-up' : active.kind === 'program' ? getProgram(active.programId!).name : 'stretch'}<ArrowRight size={17} /></button></div>}
      <div className="dashboard-layout"><div className="anatomy-column"><div className="body-mode" role="group" aria-label="Body display"><button type="button" aria-pressed={bodyMode === 'today'} onClick={() => setBodyMode('today')}>Today</button><button type="button" aria-pressed={bodyMode === 'coverage'} onClick={() => setBodyMode('coverage')}>Coverage</button></div><BodyMap view={view} setView={setView} selected={selected} completed={bodyMode === 'today' ? completed : new Set<RegionId>()} coverageTones={bodyMode === 'coverage' ? coverageTones : undefined} onSelect={select} coverageLabel={bodyMode === 'today' ? 'Today’s static stretches' : 'Recent static coverage · last 42 days'} />{bodyMode === 'coverage' && <div className="coverage-map-key"><span>Well Covered · frequently included</span><span>Less Covered · fewer recent days</span><span>Building Data · more history needed</span>{selectedCoverage && <strong>{regions[selectedCoverage.region].label}: {selectedCoverage.label} · {selectedCoverage.days} stretching days</strong>}</div>}</div>
        <aside className="stretch-panel" aria-label="Selected stretch">
          {selected && stretch ? <div className="selected-stretch"><div className="panel-kicker"><span className="eyebrow">Your focus</span><span className="mini-label">{completeIds.has(stretch.id) ? <><Check size={13} /> Stretch complete</> : 'Ready'}</span></div>
            <h2 ref={selectionTitle} tabIndex={-1}>{regions[selected].label}</h2>
            {choices.length > 1 ? <label className="stretch-picker">Stretch<select value={stretch.id} onChange={event => { setStretchIndex(choices.findIndex(item => item.id === event.target.value)); setGuideOpen(false) }}>{choices.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label> : <h3>{stretch.name}</h3>}
            <p className="prescription">{prescription({ ...stretch, defaultHoldSeconds: preferences.holdSeconds, defaultSets: preferences.sets })}</p>
            <button className="primary-button" ref={startButton} onClick={() => onStart([stretch.id])}>Start stretch<ArrowRight size={18} /></button>
            <details className="preview-guide" open={guideOpen} onToggle={event => setGuideOpen(event.currentTarget.open)}><summary>How to stretch</summary><StretchGuide stretch={stretch} /></details>{selected === 'calves' && <p className="calf-coverage-note">Today’s coverage follows your programs. The full calf library includes both variations.</p>}
          </div> : <div className="empty-selection"><span className="empty-orbit" aria-hidden="true"><MoveUpRight size={28} /></span><h2>Where would you<br /> like to start?</h2><p>Select a muscle to see its stretch.</p></div>}
          <TodayProgram schedule={schedule} preferences={preferences} history={history} active={active?.kind === 'mobility' ? null : active} today={today} onPrograms={onPrograms} onStart={onStartProgram} />
        </aside>
      </div>
      <section className="region-index" aria-labelledby="region-title"><div className="region-index-heading"><h2 id="region-title">Choose your region</h2><span>{bodyMode === 'today' ? `${completed.size} / 13 complete` : 'Recent · last 42 days'}</span></div><div className="region-groups">{regionGroups.map(group => <div className="region-group" key={group.label}><h3>{group.label}</h3><div className="region-buttons">{group.ids.map((id, index) => <button type="button" className={`region-button ${bodyMode === 'today' && completed.has(id) ? 'is-complete' : ''}`} key={id} aria-pressed={selected === id} aria-label={`${regions[id].label}, ${bodyMode === 'today' ? completed.has(id) ? 'complete today' : 'not complete today' : coverage.find(item => item.region === id)?.label ?? 'Building Data'}`} onClick={() => { select(id); setTimeout(() => { if (window.innerWidth < 700) selectionTitle.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); selectionTitle.current?.focus({ preventScroll: true }) }, 0) }}><span className="region-number" aria-hidden="true">{(index + 1).toString().padStart(2, '0')}</span><span>{regions[id].shortLabel ?? regions[id].label}</span>{bodyMode === 'coverage' ? <small>{coverage.find(item => item.region === id)?.label}</small> : completed.has(id) ? <Check size={15} /> : <ArrowRight size={15} aria-hidden="true" />}</button>)}</div></div>)}</div></section>
      <p className="dashboard-note">Warm up first. Hold steady, breathe normally, and stay in a comfortable range.</p>
    </main>
}
