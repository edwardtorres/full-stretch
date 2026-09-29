import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Pause, Play, SkipForward } from 'lucide-react'
import { getMobilityMovement, getMobilityRoutine } from '../../data/mobility'
import { regions } from '../../data/regions'
import { clockText } from '../../lib/stretch'
import { currentMobilityStep, mobilityCompletedCount, mobilityMovedRegions, mobilityPrescriptionText } from '../../lib/mobility'
import type { MobilityAction, MobilitySessionState } from '../../lib/mobility'
import { ConfirmDialog } from '../ConfirmDialog'
import { MobilityRegionMap } from './MobilityRegionMap'

export function MobilitySessionPage({ state, dispatch, onExit, earnedEvents = [] }: { state: MobilitySessionState; dispatch: (action: MobilityAction) => void; onExit: () => void; earnedEvents?: string[] }) {
  const routine = getMobilityRoutine(state.routineId)
  const step = currentMobilityStep(state)
  const movement = getMobilityMovement(step.movementId)
  const moved = mobilityMovedRegions(state.results)
  const included = new Set(state.steps.flatMap(item => [...getMobilityMovement(item.movementId).primaryRegions]))
  const title = useRef<HTMLHeadingElement>(null)
  const actions = useRef<HTMLDivElement>(null)
  const previousPhase = useRef(state.phase)
  useEffect(() => {
    if (previousPhase.current !== state.phase && state.phase !== 'complete' && (document.activeElement === document.body || previousPhase.current === 'running' && state.phase === 'movement-complete')) actions.current?.querySelector<HTMLButtonElement>('.primary-button')?.focus({ preventScroll: true })
    previousPhase.current = state.phase
  }, [state.phase])
  const [confirmFinish, setConfirmFinish] = useState(false)
  useEffect(() => { title.current?.focus() }, [state.movementIndex, state.phase === 'complete'])
  useEffect(() => {
    if (state.phase !== 'running') return
    const tick = () => dispatch({ type: 'TICK', now: Date.now() })
    const interval = window.setInterval(tick, 200)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick) }
  }, [state.phase, dispatch])
  const completed = mobilityCompletedCount(state)
  const skipped = state.results.filter(result => result.status === 'skipped').length
  const current = new Set(state.phase === 'movement-complete' ? [] : movement.primaryRegions)
  const announce = state.phase === 'running' ? 'Timed movement started.' : state.phase === 'paused' ? 'Timed movement paused.' : state.phase === 'movement-complete' ? state.results.at(-1)?.status === 'skipped' ? 'Movement skipped.' : 'Movement complete. Next movement is ready when you are.' : state.phase === 'complete' ? 'Warm-up finished.' : `${movement.name}. Ready for ${mobilityPrescriptionText(step.prescription)}.`
  if (state.phase === 'complete') return <main id="main" className="secondary-page mobility-summary"><div className="mobility-summary-mark"><Check size={25} aria-hidden="true" /></div><p className="eyebrow">Mobility · Dynamic warm-up</p><h1 ref={title} tabIndex={-1}>{routine.name} {skipped ? 'finished.' : 'complete.'}</h1><p className="page-intro">{completed} / {state.steps.length} movements completed{skipped ? ` · ${skipped} skipped` : ''}</p>
    <div className="progress-totals"><div><b>{completed}</b><span>Movements completed</span></div><div><b>{skipped}</b><span>Skipped</span></div><div><b>{clockText(Math.max(0, Math.floor((Date.parse(state.completedAt!) - Date.parse(state.startedAt)) / 1000)))}</b><span>Session duration</span></div></div>
    {earnedEvents.length > 0 && <div className="earned-events" role="status"><strong>Earned this session</strong><ul>{earnedEvents.map(event => <li key={event}>{event}</li>)}</ul></div>}
    <h2 className="section-title">Regions moved</h2>{moved.size ? <ul className="program-regions">{[...moved].map(id => <li key={id}>{regions[id].label}</li>)}</ul> : <p className="muted">No movements completed yet.</p>}
    <p className="mobility-map-note">These are dynamic movements. Static stretch coverage is tracked separately.</p><button className="primary-button program-start" onClick={onExit}>Return to Mobility <ArrowRight size={17} /></button><p className="sr-only" role="status" aria-live="polite">{announce}</p></main>
  return <main id="main" className="mobility-session"><div className="mobility-session-main"><div className="session-top"><button className="text-button" onClick={onExit}><ArrowLeft size={16} /> Back to Mobility</button><span className="mini-label">Movement {state.movementIndex + 1} of {state.steps.length}</span></div>
    <p className="eyebrow">Mobility · {routine.name}</p><h1 ref={title} tabIndex={-1}>{movement.name}</h1><p className="mobility-purpose">{movement.purpose}</p>
    <div className="mobility-prescription"><span className="mini-label">{step.prescription.kind === 'seconds' ? 'Timed movement' : 'Repetitions'}</span><strong>{mobilityPrescriptionText(step.prescription)}</strong>{step.prescription.kind === 'reps' && <small>{step.prescription.perSide ? 'Complete both sides, then confirm.' : step.prescription.directions?.length ? 'Complete both directions, then confirm.' : 'Count at your own pace, then confirm.'}</small>}</div>
    <div className="mobility-cues"><section><h2>Set up</h2><div>{movement.setupCues.map(cue => <p key={cue}>{cue}</p>)}</div></section><section><h2>Move</h2><div>{movement.movementCues.map(cue => <p key={cue}>{cue}</p>)}</div></section><section><h2>Range</h2><div><p>{movement.safetyCue}</p></div></section></div>
    {step.prescription.kind === 'seconds' && <div className="mobility-timer"><span className="mini-label">{state.phase === 'running' ? 'Moving' : state.phase === 'paused' ? 'Paused' : state.phase === 'movement-complete' ? state.results.at(-1)?.status === 'skipped' ? 'Movement skipped' : 'Movement complete' : 'Ready'}</span><div role="timer" aria-live="off" aria-label={`${Math.ceil(state.remainingMs / 1000)} seconds remaining`}>{clockText(Math.ceil(state.remainingMs / 1000))}</div></div>}
    {state.phase === 'movement-complete' ? <div className="mobility-actions" ref={actions}><p className="mobility-result">{state.results.at(-1)?.status === 'skipped' ? 'Movement skipped.' : 'Movement complete.'}</p><button className="primary-button" onClick={() => dispatch({ type: 'NEXT', now: Date.now() })}>{state.movementIndex + 1 === state.steps.length ? 'Finish warm-up' : 'Next movement'} <ArrowRight size={17} /></button></div> : <div className="mobility-actions" ref={actions}>
      {step.prescription.kind === 'seconds' && state.phase === 'ready' && <button className="primary-button" onClick={() => dispatch({ type: 'START', now: Date.now() })}><Play size={17} /> Start movement</button>}
      {step.prescription.kind === 'seconds' && state.phase === 'running' && <button className="primary-button" onClick={() => dispatch({ type: 'PAUSE', now: Date.now() })}><Pause size={17} /> Pause</button>}
      {step.prescription.kind === 'seconds' && state.phase === 'paused' && <button className="primary-button" onClick={() => dispatch({ type: 'RESUME', now: Date.now() })}><Play size={17} /> Resume</button>}
      {step.prescription.kind === 'seconds' && (state.phase === 'running' || state.phase === 'paused') && <button className="outline-button" onClick={() => dispatch({ type: 'COMPLETE_EARLY', now: Date.now() })}>Complete early</button>}
      {step.prescription.kind === 'reps' && <button className="primary-button" onClick={() => dispatch({ type: 'DONE', now: Date.now() })}><Check size={17} /> Movement complete</button>}
      <button className="text-button" onClick={() => dispatch({ type: 'SKIP', now: Date.now() })}><SkipForward size={15} /> Skip movement</button>
    </div>}

    {movement.equipment.length > 0 && <p className="equipment-label">You’ll need: {movement.equipment.join(', ')}</p>}
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announce}</p><button className="text-button finish-early-button" onClick={() => setConfirmFinish(true)}>Finish warm-up now</button>
  </div><aside className="mobility-session-aside"><MobilityRegionMap current={current} moved={moved} included={included} /><p className="mobility-count">{completed} / {state.steps.length} movements completed</p></aside>
  {confirmFinish && <ConfirmDialog title="Finish this warm-up?" onClose={() => setConfirmFinish(false)}><p>Completed movements and time already spent will be saved. The rest will be recorded as skipped.</p><div className="confirm-actions"><button className="outline-button" onClick={() => setConfirmFinish(false)}>Keep moving</button><button className="primary-button" onClick={() => { setConfirmFinish(false); dispatch({ type: 'FINISH_EARLY', now: Date.now() }) }}>Finish and save</button></div></ConfirmDialog>}
  </main>
}
