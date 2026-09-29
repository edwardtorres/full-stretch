import { getMobilityMovement, getMobilityRoutine, isMobilityMovementId, isMobilityRoutineId } from '../data/mobility'
import type { MobilityMovementId, MobilityPrescription, MobilityRoutineId } from '../types/mobility'
import type { RegionId } from '../types/stretch'
import { isoInstant, object } from './profile'

export interface MobilityStep { movementId: MobilityMovementId; prescription: MobilityPrescription }
export interface MobilityResult extends MobilityStep { status: 'completed' | 'skipped'; actualTimedMs: number | null }
export type MobilityPhase = 'ready' | 'running' | 'paused' | 'movement-complete' | 'complete'
export interface MobilitySessionState {
  kind: 'mobility'
  id: string
  routineId: MobilityRoutineId
  startedAt: string
  completedAt: string | null
  steps: MobilityStep[]
  movementIndex: number
  phase: MobilityPhase
  deadline: number | null
  remainingMs: number
  results: MobilityResult[]
}
export type MobilityAction = { type: 'START' | 'TICK' | 'PAUSE' | 'RESUME' | 'SKIP' | 'COMPLETE_EARLY' | 'DONE' | 'NEXT' | 'FINISH_EARLY'; now: number }
export const validMobilityPrescription = (value: unknown): value is MobilityPrescription => {
  if (!object(value)) return false
  if (value.kind === 'seconds') return Number.isInteger(value.seconds) && (value.seconds as number) > 0 && (value.seconds as number) <= 600
  if (value.kind !== 'reps' || !Number.isInteger(value.reps) || (value.reps as number) < 1 || (value.reps as number) > 100 || typeof value.perSide !== 'boolean') return false
  if (value.directions === undefined) return true
  return !value.perSide && Array.isArray(value.directions) && value.directions.length > 0 && value.directions.every(item => object(item) && typeof item.label === 'string' && item.label.length > 0 && Number.isInteger(item.reps) && (item.reps as number) > 0) && value.directions.reduce((total: number, item: { reps: number }) => total + item.reps, 0) === value.reps
}
export const mobilityPrescriptionText = (prescription: MobilityPrescription): string => prescription.kind === 'seconds' ? `${prescription.seconds} sec` : prescription.directions?.length ? prescription.directions.map(part => `${part.reps} ${part.label.toLowerCase()}`).join(' · ') : `${prescription.reps} ${prescription.perSide ? 'per side' : 'reps'}`
export function createMobilitySession(routineId: MobilityRoutineId, now = Date.now(), id: string = crypto.randomUUID()): MobilitySessionState {
  const routine = getMobilityRoutine(routineId)
  const steps = routine.steps.map(step => ({ movementId: step.movementId, prescription: structuredClone(step.prescription ?? getMobilityMovement(step.movementId).prescription) }))
  return { kind: 'mobility', id, routineId, startedAt: new Date(now).toISOString(), completedAt: null, steps, movementIndex: 0, phase: 'ready', deadline: null, remainingMs: steps[0].prescription.kind === 'seconds' ? steps[0].prescription.seconds * 1000 : 0, results: [] }
}
export const currentMobilityStep = (state: MobilitySessionState) => state.steps[state.movementIndex]
const timedElapsed = (state: MobilitySessionState, now: number) => {
  const step = currentMobilityStep(state)
  if (step.prescription.kind !== 'seconds') return null
  const remaining = state.phase === 'running' && state.deadline !== null ? Math.max(0, state.deadline - now) : state.remainingMs
  return Math.max(0, Math.min(step.prescription.seconds * 1000, step.prescription.seconds * 1000 - remaining))
}
function endMovement(state: MobilitySessionState, status: MobilityResult['status'], now: number): MobilitySessionState {
  if (!['ready', 'running', 'paused'].includes(state.phase)) return state
  return { ...state, phase: 'movement-complete', deadline: null, remainingMs: 0, results: [...state.results, { ...currentMobilityStep(state), status, actualTimedMs: timedElapsed(state, now) }] }
}
export function mobilityReducer(state: MobilitySessionState, action: MobilityAction): MobilitySessionState {
  const prescription = currentMobilityStep(state).prescription
  switch (action.type) {
    case 'START': return state.phase === 'ready' && prescription.kind === 'seconds' ? { ...state, phase: 'running', deadline: action.now + state.remainingMs } : state
    case 'TICK': {
      if (state.phase !== 'running' || state.deadline === null) return state
      const remainingMs = Math.max(0, state.deadline - action.now)
      return remainingMs === 0 ? endMovement(state, 'completed', action.now) : { ...state, remainingMs }
    }
    case 'PAUSE': {
      if (state.phase !== 'running' || state.deadline === null) return state
      const remainingMs = Math.max(0, state.deadline - action.now)
      return remainingMs === 0 ? endMovement(state, 'completed', action.now) : { ...state, phase: 'paused', deadline: null, remainingMs }
    }
    case 'RESUME': return state.phase === 'paused' && prescription.kind === 'seconds' ? { ...state, phase: 'running', deadline: action.now + state.remainingMs } : state
    case 'COMPLETE_EARLY': return state.phase === 'running' || state.phase === 'paused' ? endMovement(state, 'completed', action.now) : state
    case 'DONE': return state.phase === 'ready' && prescription.kind === 'reps' ? endMovement(state, 'completed', action.now) : state
    case 'SKIP': return endMovement(state, 'skipped', action.now)
    case 'NEXT': {
      if (state.phase !== 'movement-complete') return state
      if (state.movementIndex + 1 === state.steps.length) return { ...state, phase: 'complete', completedAt: new Date(action.now).toISOString() }
      const nextIndex = state.movementIndex + 1
      const next = state.steps[nextIndex].prescription
      return { ...state, movementIndex: nextIndex, phase: 'ready', remainingMs: next.kind === 'seconds' ? next.seconds * 1000 : 0 }
    }
    case 'FINISH_EARLY': {
      if (state.phase === 'complete') return state
      const current = state.phase === 'movement-complete' ? state : endMovement(state, 'skipped', action.now)
      return { ...current, phase: 'complete', deadline: null, remainingMs: 0, completedAt: new Date(action.now).toISOString(), results: [...current.results, ...state.steps.slice(current.results.length).map(step => ({ ...step, status: 'skipped' as const, actualTimedMs: step.prescription.kind === 'seconds' ? 0 : null }))] }
    }
  }
}
export const restoreMobilitySession = (state: MobilitySessionState, now = Date.now()) => state.phase === 'running' ? mobilityReducer(state, { type: 'TICK', now }) : state
export const mobilityCompletedCount = (state: MobilitySessionState) => state.results.filter(result => result.status === 'completed').length
export const mobilityMovedRegions = (results: readonly MobilityResult[]): Set<RegionId> => new Set(results.filter(result => result.status === 'completed').flatMap(result => [...getMobilityMovement(result.movementId).primaryRegions]))

export function validMobilitySession(value: unknown): value is MobilitySessionState {
  if (!object(value) || value.kind !== 'mobility' || typeof value.id !== 'string' || !value.id || !isMobilityRoutineId(value.routineId) || !isoInstant(value.startedAt) || !Array.isArray(value.steps) || !Array.isArray(value.results) || !['ready', 'running', 'paused', 'movement-complete', 'complete'].includes(value.phase as string) || !Number.isInteger(value.movementIndex)) return false
  const routine = getMobilityRoutine(value.routineId)
  if (value.steps.length !== routine.steps.length || (value.movementIndex as number) < 0 || (value.movementIndex as number) >= value.steps.length || value.steps.some((step, i) => !object(step) || !isMobilityMovementId(step.movementId) || step.movementId !== routine.steps[i].movementId || !validMobilityPrescription(step.prescription))) return false
  const state = value as unknown as MobilitySessionState
  const phaseCount = state.phase === 'complete' ? state.steps.length : state.movementIndex + (state.phase === 'movement-complete' ? 1 : 0)
  if (state.results.length !== phaseCount || state.results.some((result, i) => !object(result) || !validMobilityPrescription(result.prescription) || result.movementId !== state.steps[i].movementId || JSON.stringify(result.prescription) !== JSON.stringify(state.steps[i].prescription) || !['completed', 'skipped'].includes(result.status) || (result.prescription.kind === 'reps' ? result.actualTimedMs !== null : typeof result.actualTimedMs !== 'number' || !Number.isFinite(result.actualTimedMs) || result.actualTimedMs < 0 || result.actualTimedMs > result.prescription.seconds * 1000))) return false
  const step = currentMobilityStep(state)
  if (!Number.isFinite(state.remainingMs) || state.remainingMs < 0 || state.remainingMs > (step.prescription.kind === 'seconds' ? step.prescription.seconds * 1000 : 0)) return false
  if (state.phase === 'running' ? step.prescription.kind !== 'seconds' || typeof state.deadline !== 'number' || !Number.isFinite(state.deadline) : state.deadline !== null) return false
  if (state.phase === 'paused' && step.prescription.kind !== 'seconds') return false
  if (['movement-complete', 'complete'].includes(state.phase) && state.remainingMs !== 0) return false
  return state.phase === 'complete' ? isoInstant(state.completedAt) && Date.parse(state.completedAt) >= Date.parse(state.startedAt) : state.completedAt === null
}
