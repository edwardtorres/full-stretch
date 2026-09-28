import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Pause, Play, SkipForward } from 'lucide-react'
import { BodyMap } from '../BodyMap'
import { StretchGuide } from '../StretchGuide'
import { regions } from '../../data/regions'
import { actualHoldSeconds, clockText, holdSequence, isStretchComplete } from '../../lib/stretch'
import { prescribedStretch, sessionPlanSeconds } from '../../lib/session'
import type { SessionAction, SessionState } from '../../lib/session'
import { completedStretchIds, coveredRegionIds } from '../../lib/coverage'
import { ConfirmDialog } from '../ConfirmDialog'
import type { BodyView } from '../../types/stretch'
export function SessionPage({ state, dispatch, onExit }: { state: SessionState; dispatch: (action: SessionAction) => void; onExit: () => void }) {
  const { ids, kind } = state
  const stretch = prescribedStretch(state)
  const [finishConfirmation, setFinishConfirmation] = useState(false)
  const sequence = useMemo(() => holdSequence(stretch), [stretch])
  const step = sequence[state.holdIndex]
  const completed = useMemo(() => coveredRegionIds(state), [state])
  const bodyCompleted = completed
  const completeCount = completedStretchIds(state).size
  const results = state.results[stretch.id] ?? []
  const lastResult = results.at(-1)
  const nextStep = sequence[state.holdIndex + 1]
  const [view, setView] = useState<BodyView>(regions[stretch.primaryRegions[0]].view)
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    setView(regions[stretch.primaryRegions[0]].view)
    title.current?.focus()
  }, [stretch.id, state.phase === 'complete'])
  useEffect(() => {
    if (state.phase !== 'holding') return
    const tick = () => dispatch({ type: 'TICK', now: Date.now() })
    const interval = window.setInterval(tick, 200)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick) }
  }, [state.phase, dispatch])
  const announced = state.phase === 'holding' ? 'Hold started. Breathe normally.' : state.phase === 'paused' ? 'Hold paused.' : state.phase === 'transition' || state.phase === 'stretch-complete' ? lastResult?.status === 'skipped' ? 'Hold skipped.' : 'Hold complete.' : state.phase === 'complete' ? 'Session finished.' : `${step.side ? `${step.side} side. ` : ''}Set ${step.set} of ${stretch.defaultSets}. Ready to start hold.`
  if (state.phase === 'complete') {
    const allResults = Object.values(state.results).flat()
    const doneHolds = allResults.filter(result => result.status === 'completed').length
    const skipped = allResults.length - doneHolds
    const allComplete = completeCount === ids.length
    return <main id="main" className="completion-layout">
      <section className="completion-content"><div className="completion-icon">{allComplete ? <Check size={28} /> : <ArrowRight size={28} />}</div><p className="eyebrow">{kind === 'full-body' ? 'Full body stretch' : regions[stretch.primaryRegions[0]].label}</p>
        <h1 tabIndex={-1} ref={title}>{allComplete ? kind === 'full-body' ? 'Full body stretch complete.' : stretch.primaryRegions[0] === 'calves' ? 'Stretch complete.' : `${regions[stretch.primaryRegions[0]].label} complete.` : 'Session finished.'}</h1>
        <p className="muted">{kind === 'targeted' ? stretch.name : `${completeCount} / ${ids.length} stretches complete`}</p>
        <div className="summary-stats"><div><b>{clockText(actualHoldSeconds(state.results))}</b><span>Hold time</span></div><div><b>{doneHolds}</b><span>Holds complete</span></div></div>
        {kind === 'targeted' && <p className="muted">{stretch.defaultSets} sets{stretch.unilateral ? ' per side' : ''} · {stretch.defaultHoldSeconds} sec each</p>}
        {skipped > 0 && <p className="skip-summary">{skipped} {skipped === 1 ? 'hold' : 'holds'} skipped. A region is complete when all its holds are finished.</p>}
        {kind === 'targeted' && stretch.primaryRegions.includes('calves') && allComplete && <p className="muted">This calf stretch is complete. Calves coverage requires both calf variations.</p>}
        <div className="completed-region-list" aria-label="Regions completed">{[...completed].map(id => <span key={id}><Check size={14} /> {regions[id].label}</span>)}</div>
        <button className="primary-button" onClick={onExit}>{kind === 'targeted' ? 'Return to body' : 'Return to dashboard'}<ArrowRight size={18} /></button>
      </section>
      <BodyMap view={view} setView={setView} selected={null} completed={bodyCompleted} onSelect={() => {}} interactive={false} />
    </main>
  }
  const phaseLabel = state.phase === 'holding' ? 'Hold' : state.phase === 'paused' ? 'Paused' : state.phase === 'ready' ? 'Ready' : lastResult?.status === 'skipped' ? 'Hold skipped' : 'Hold complete'
  return <main id="main" className="session-layout">
    <aside className="session-anatomy"><BodyMap view={view} setView={setView} selected={stretch.primaryRegions[0]} completed={bodyCompleted} onSelect={() => {}} interactive={false} />
      {kind === 'full-body' && <p className="body-progress"><Check size={14} /> {completeCount} / {ids.length} stretches complete</p>}
    </aside>
    <section className="session-content">
      <div className="session-top"><button className="text-button" onClick={onExit}><ArrowLeft size={16} /> Back to body</button><span className="mini-label">{kind === 'full-body' ? `Stretch ${state.stretchIndex + 1} of ${ids.length}` : 'Targeted stretch'}</span></div>
      {kind === 'full-body' && <p className="eyebrow">Full body stretch</p>}
      <p className="region-heading">{regions[stretch.primaryRegions[0]].label}</p><h1 ref={title} tabIndex={-1}>{stretch.name}</h1>
      <div className="hold-metadata"><span>Set {step.set} of {stretch.defaultSets}</span><strong>{step.side ? `${step.side === 'left' ? 'Left' : 'Right'} side` : 'Both sides'}</strong><span>{stretch.defaultHoldSeconds} sec</span></div>
      <div className="hold-tracker" aria-label="Prescribed holds">{sequence.map((item, index) => <span key={index} aria-current={index === state.holdIndex ? 'step' : undefined} className={results[index]?.status ?? (index === state.holdIndex ? 'current' : '')}>
        {results[index]?.status === 'completed' ? <Check size={12} aria-hidden="true" /> : results[index]?.status === 'skipped' ? <SkipForward size={12} aria-hidden="true" /> : <span className="hold-dot" aria-hidden="true" />}
        {item.set}{item.side ? ` ${item.side === 'left' ? 'L' : 'R'}` : ''}<span className="sr-only">{results[index]?.status ?? (index === state.holdIndex ? 'current' : 'pending')}</span>
      </span>)}</div>
      <div className="timer-panel" data-phase={state.phase}><span className="mini-label">{phaseLabel}</span><div className="timer-number" role="timer" aria-live="off" aria-label={`${Math.ceil(state.remaining / 1000)} seconds remaining`}>{clockText(Math.ceil(state.remaining / 1000))}</div>
        <p>{state.phase === 'transition' ? nextStep?.side !== step.side ? `Relax, then switch to your ${nextStep?.side} side.` : 'Relax, then prepare for the next set.' : state.phase === 'stretch-complete' ? isStretchComplete(stretch, results) ? 'All holds complete. Take a breath.' : 'Stretch finished. Skipped holds are recorded separately.' : 'Strong but comfortable. Breathe normally.'}</p>
        <div className="timer-actions">
          {state.phase === 'ready' && <button className="primary-button" onClick={() => dispatch({ type: 'START', now: Date.now() })}><Play size={17} /> Start hold</button>}
          {state.phase === 'holding' && <button className="primary-button" onClick={() => dispatch({ type: 'PAUSE', now: Date.now() })}><Pause size={17} /> Pause</button>}
          {state.phase === 'paused' && <button className="primary-button" onClick={() => dispatch({ type: 'RESUME', now: Date.now() })}><Play size={17} /> Resume</button>}
          {['ready', 'holding', 'paused'].includes(state.phase) && <button className="text-button" onClick={() => dispatch({ type: 'SKIP', now: Date.now() })}><SkipForward size={15} /> Skip hold</button>}
          {state.phase === 'transition' && <button className="primary-button" onClick={() => dispatch({ type: 'NEXT_HOLD' })}>{nextStep?.side !== step.side ? 'Switch side' : 'Next set'}<ArrowRight size={17} /></button>}
          {state.phase === 'stretch-complete' && <button className="primary-button" onClick={() => dispatch({ type: 'NEXT_STRETCH', now: Date.now() })}>{state.stretchIndex + 1 === ids.length ? kind === 'targeted' ? 'Finish stretch' : 'Finish session' : 'Next stretch'}<ArrowRight size={17} /></button>}
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announced}</p>
      {state.phase === 'transition' && nextStep && <p className="next-step">Up next · Set {nextStep.set}{nextStep.side ? ` · ${nextStep.side === 'left' ? 'Left' : 'Right'} side` : ''}</p>}
      <StretchGuide stretch={stretch} />
      {stretch.equipment.length > 0 && <p className="equipment-label">You’ll need: {stretch.equipment.join(', ')}</p>}
      <p className="sr-only">Planned session hold time {clockText(sessionPlanSeconds(state))}</p>
      <button className="text-button finish-early-button" onClick={() => setFinishConfirmation(true)}>Finish session now</button>
    </section>
    {finishConfirmation && <ConfirmDialog title="Finish this session?" onClose={() => setFinishConfirmation(false)}><p>Your completed holds and partial hold time will be saved. Remaining holds will be recorded as skipped.</p><div className="confirm-actions"><button className="outline-button" onClick={() => setFinishConfirmation(false)}>Keep stretching</button><button className="primary-button" onClick={() => { setFinishConfirmation(false); dispatch({ type: 'FINISH_EARLY', now: Date.now() }) }}>Finish and save</button></div></ConfirmDialog>}
  </main>
}
