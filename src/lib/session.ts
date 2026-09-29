import { getProgram } from './programs'
import type { ProgramId } from '../types/program'
import { getStretch, holdSequence, remainingMs } from './stretch'
import type { HoldResult, HoldStep, Stretch } from '../types/stretch'
import type { StretchPreferences } from '../types/profile'
export type SessionPhase = 'ready' | 'holding' | 'paused' | 'transition' | 'stretch-complete' | 'complete'
export interface SessionState {
  id: string
  startedAt: string
  completedAt: string | null
  prescriptions: Record<string, { holdSeconds: number; sets: number }>
  kind: 'targeted' | 'program'
  programId: ProgramId | null
  holds: Record<string, HoldStep[]>
  ids: string[]
  stretchIndex: number
  holdIndex: number
  phase: SessionPhase
  deadline: number | null
  remaining: number
  results: Record<string, HoldResult[]>
}
export type SessionAction = { type: 'START' | 'TICK' | 'PAUSE' | 'RESUME' | 'SKIP'; now: number } | { type: 'NEXT_HOLD' | 'NEXT_STRETCH'; now?: number } | { type: 'FINISH_EARLY'; now: number }
export function createSession(ids: string[], kind: 'targeted' | 'full-body', preferences?: StretchPreferences, now = Date.now(), id: string = crypto.randomUUID()): SessionState {
  if (!ids.length) throw new Error('A session needs at least one stretch')
  const prescriptions = Object.fromEntries(ids.map(id => { const stretch = getStretch(id); return [id, { holdSeconds: preferences?.holdSeconds ?? stretch.defaultHoldSeconds, sets: preferences?.sets ?? stretch.defaultSets }] }))
  return { id, startedAt: new Date(now).toISOString(), completedAt: null, prescriptions, kind: kind === 'full-body' ? 'program' : 'targeted', programId: kind === 'full-body' ? 'full-20' : null, holds: Object.fromEntries(ids.map(id => [id, holdSequence({ ...getStretch(id), defaultHoldSeconds: prescriptions[id].holdSeconds, defaultSets: prescriptions[id].sets })])), ids: [...ids], stretchIndex: 0, holdIndex: 0, phase: 'ready', deadline: null, remaining: prescriptions[ids[0]].holdSeconds * 1000, results: {} }
}
export function prescribedStretch(state: SessionState, id = state.ids[state.stretchIndex]): Stretch {
  const canonical = getStretch(id)
  const prescription = state.prescriptions[id]
  return { ...canonical, defaultHoldSeconds: prescription.holdSeconds, defaultSets: prescription.sets }
}
export const sessionHoldSequence = (state: SessionState, id = state.ids[state.stretchIndex]) => state.holds[id]
export function createProgramSession(programId: ProgramId, preferences: StretchPreferences, now = Date.now(), id: string = crypto.randomUUID()): SessionState {
  return { ...createSession([...getProgram(programId).stretchIds], 'targeted', preferences, now, id), kind: 'program', programId }
}
export const sessionPlanSeconds = (state: SessionState) => state.ids.reduce((sum, id) => sum + sessionHoldSequence(state, id).reduce((time, step) => time + step.seconds, 0), 0)
export function restoreSession(state: SessionState, now = Date.now()): SessionState {
  return state.phase === 'holding' ? sessionReducer(state, { type: 'TICK', now }) : state
}

function finishHold(state: SessionState, status: HoldResult['status'], remaining: number): SessionState {
  const id = state.ids[state.stretchIndex]
  const sequence = sessionHoldSequence(state, id)
  const step = sequence[state.holdIndex]
  const result: HoldResult = { step, status, heldMs: Math.max(0, Math.min(step.seconds * 1000, step.seconds * 1000 - remaining)) }
  return { ...state, remaining: 0, deadline: null, results: { ...state.results, [id]: [...(state.results[id] ?? []), result] }, phase: state.holdIndex + 1 < sequence.length ? 'transition' : 'stretch-complete' }
}
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START':
      return state.phase === 'ready' ? { ...state, phase: 'holding', deadline: action.now + state.remaining } : state
    case 'RESUME':
      return state.phase === 'paused' ? { ...state, phase: 'holding', deadline: action.now + state.remaining } : state
    case 'TICK': {
      if (state.phase !== 'holding' || state.deadline === null) return state
      const left = remainingMs(state.deadline, action.now)
      return left === 0 ? finishHold(state, 'completed', 0) : { ...state, remaining: left }
    }
    case 'PAUSE': {
      if (state.phase !== 'holding' || state.deadline === null) return state
      const left = remainingMs(state.deadline, action.now)
      return left === 0 ? finishHold(state, 'completed', 0) : { ...state, phase: 'paused', deadline: null, remaining: left }
    }
    case 'SKIP': {
      if (!['ready', 'holding', 'paused'].includes(state.phase)) return state
      const left = state.phase === 'holding' && state.deadline !== null ? remainingMs(state.deadline, action.now) : state.remaining
      return finishHold(state, left === 0 ? 'completed' : 'skipped', left)
    }
    case 'NEXT_HOLD': {
      if (state.phase !== 'transition') return state
      return { ...state, holdIndex: state.holdIndex + 1, phase: 'ready', remaining: prescribedStretch(state).defaultHoldSeconds * 1000 }
    }
    case 'FINISH_EARLY': {
      if (state.phase === 'complete') return state
      let next = state
      if (['ready', 'holding', 'paused'].includes(state.phase)) next = sessionReducer(state, { type: 'SKIP', now: action.now })
      const results = { ...next.results }
      for (const id of state.ids) {
        const sequence = sessionHoldSequence(state, id)
        const existing = results[id] ?? []
        results[id] = [...existing, ...sequence.slice(existing.length).map(step => ({ step, status: 'skipped' as const, heldMs: 0 }))]
      }
      return { ...next, phase: 'complete', remaining: 0, deadline: null, results, completedAt: new Date(action.now).toISOString() }
    }
    case 'NEXT_STRETCH': {
      if (state.phase !== 'stretch-complete') return state
      if (state.stretchIndex + 1 === state.ids.length) return { ...state, phase: 'complete', completedAt: new Date(action.now ?? Date.now()).toISOString() }
      return { ...state, stretchIndex: state.stretchIndex + 1, holdIndex: 0, phase: 'ready', remaining: prescribedStretch(state, state.ids[state.stretchIndex + 1]).defaultHoldSeconds * 1000 }
    }
  }
}
