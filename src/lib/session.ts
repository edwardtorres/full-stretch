import { getStretch, holdSequence, remainingMs } from './stretch'
import type { HoldResult } from '../types/stretch'
export type SessionPhase = 'ready' | 'holding' | 'paused' | 'transition' | 'stretch-complete' | 'complete'
export interface SessionState {
  kind: 'targeted' | 'full-body'
  ids: string[]
  stretchIndex: number
  holdIndex: number
  phase: SessionPhase
  deadline: number | null
  remaining: number
  results: Record<string, HoldResult[]>
}
export type SessionAction = { type: 'START' | 'TICK' | 'PAUSE' | 'RESUME' | 'SKIP'; now: number } | { type: 'NEXT_HOLD' | 'NEXT_STRETCH' }
export function createSession(ids: string[], kind: SessionState['kind']): SessionState {
  if (!ids.length) throw new Error('A session needs at least one stretch')
  return { kind, ids, stretchIndex: 0, holdIndex: 0, phase: 'ready', deadline: null, remaining: getStretch(ids[0]).defaultHoldSeconds * 1000, results: {} }
}
function finishHold(state: SessionState, status: HoldResult['status'], remaining: number): SessionState {
  const id = state.ids[state.stretchIndex]
  const sequence = holdSequence(getStretch(id))
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
      return { ...state, holdIndex: state.holdIndex + 1, phase: 'ready', remaining: getStretch(state.ids[state.stretchIndex]).defaultHoldSeconds * 1000 }
    }
    case 'NEXT_STRETCH': {
      if (state.phase !== 'stretch-complete') return state
      if (state.stretchIndex + 1 === state.ids.length) return { ...state, phase: 'complete' }
      return { ...state, stretchIndex: state.stretchIndex + 1, holdIndex: 0, phase: 'ready', remaining: getStretch(state.ids[state.stretchIndex + 1]).defaultHoldSeconds * 1000 }
    }
  }
}
