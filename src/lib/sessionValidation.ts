import { fullBodyIds } from '../data/stretches'
import { getStretch, holdSequence } from './stretch'
import { isoInstant, object } from './profile'
import { prescribedStretch } from './session'
import type { SessionState } from './session'
export function validActiveSession(value: unknown): value is SessionState | null {
  if (value === null) return true
  if (!object(value) || typeof value.id !== 'string' || !value.id || !isoInstant(value.startedAt) || !['targeted', 'full-body'].includes(value.kind as string) || !Array.isArray(value.ids) || !value.ids.length || new Set(value.ids).size !== value.ids.length || !object(value.prescriptions) || !object(value.results) || !['ready', 'holding', 'paused', 'transition', 'stretch-complete', 'complete'].includes(value.phase as string)) return false
  const ids = value.ids
  if (value.kind === 'targeted' && ids.length !== 1) return false
  if (value.kind === 'full-body' && (ids.length !== fullBodyIds.length || ids.some((id, index) => id !== fullBodyIds[index]))) return false
  if (!ids.every(id => {
    if (typeof id !== 'string') return false
    try { getStretch(id) } catch { return false }
    const prescription = (value.prescriptions as Record<string, unknown>)[id]
    return object(prescription) && [20, 30, 45].includes(prescription.holdSeconds as number) && [1, 2, 3].includes(prescription.sets as number)
  })) return false
  const state = value as unknown as SessionState
  if (!Number.isInteger(state.stretchIndex) || state.stretchIndex < 0 || state.stretchIndex >= ids.length || !Number.isInteger(state.holdIndex) || state.holdIndex < 0) return false
  const currentSequence = holdSequence(prescribedStretch(state))
  if (state.holdIndex >= currentSequence.length || typeof state.remaining !== 'number' || !Number.isFinite(state.remaining) || state.remaining < 0 || state.remaining > currentSequence[state.holdIndex].seconds * 1000) return false
  if (state.phase === 'holding' ? typeof state.deadline !== 'number' || !Number.isFinite(state.deadline) : state.deadline !== null) return false
  if (state.phase === 'complete' ? !isoInstant(state.completedAt) || Date.parse(state.completedAt) < Date.parse(state.startedAt) : state.completedAt !== null) return false
  if (['transition', 'stretch-complete', 'complete'].includes(state.phase) && state.remaining !== 0) return false
  if (state.phase === 'transition' && state.holdIndex === currentSequence.length - 1) return false
  if (state.phase === 'stretch-complete' && state.holdIndex !== currentSequence.length - 1) return false
  if (Object.keys(state.results).some(id => !ids.includes(id))) return false
  return state.ids.every((id, index) => {
    const results = state.results[id] ?? []
    const sequence = holdSequence(prescribedStretch(state, id))
    const count = state.phase === 'complete' || index < state.stretchIndex ? sequence.length : index > state.stretchIndex ? 0 : state.holdIndex + (['transition', 'stretch-complete'].includes(state.phase) ? 1 : 0)
    return Array.isArray(results) && results.length === count && results.every((result, holdIndex) => object(result) && object(result.step) && result.step.set === sequence[holdIndex].set && result.step.side === sequence[holdIndex].side && result.step.seconds === sequence[holdIndex].seconds && ['completed', 'skipped'].includes(result.status as string) && typeof result.heldMs === 'number' && Number.isFinite(result.heldMs) && result.heldMs >= 0 && result.heldMs <= sequence[holdIndex].seconds * 1000 && (result.status !== 'completed' || result.heldMs === sequence[holdIndex].seconds * 1000))
  })
}
