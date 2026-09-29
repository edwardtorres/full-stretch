import { getMobilityMovement, getMobilityRoutine, isMobilityRoutineId } from '../data/mobility'
import type { HistoryEntry, MobilityHistoryEntry, StretchHistoryEntry } from '../types/history'
import type { MobilitySessionState } from './mobility'
import { validMobilityPrescription } from './mobility'
import { isoInstant, object } from './profile'
import { localDayKey, sameLocalDay } from './dates'

export const isFlexibilityHistory = (entry: HistoryEntry): entry is StretchHistoryEntry => entry.activityType === 'flexibility'
export const isMobilityHistory = (entry: HistoryEntry): entry is MobilityHistoryEntry => entry.activityType === 'mobility'
export function historicalMobilitySession(state: MobilitySessionState): MobilityHistoryEntry | null {
  if (state.phase !== 'complete' || !state.completedAt) return null
  return { activityType: 'mobility', id: state.id, routineId: state.routineId, startedAt: state.startedAt, completedAt: state.completedAt, durationSeconds: Math.max(0, Math.floor((Date.parse(state.completedAt) - Date.parse(state.startedAt)) / 1000)), movements: state.results.map(result => ({ movementId: result.movementId, prescription: structuredClone(result.prescription), status: result.status, actualTimedMs: result.actualTimedMs })) }
}
export function validMobilityHistory(value: unknown): value is MobilityHistoryEntry {
  if (!object(value) || value.activityType !== 'mobility' || typeof value.id !== 'string' || !value.id || !isMobilityRoutineId(value.routineId) || !isoInstant(value.startedAt) || !isoInstant(value.completedAt) || Date.parse(value.completedAt) < Date.parse(value.startedAt) || !Number.isInteger(value.durationSeconds) || value.durationSeconds !== Math.floor((Date.parse(value.completedAt) - Date.parse(value.startedAt)) / 1000) || !Array.isArray(value.movements)) return false
  const steps = getMobilityRoutine(value.routineId).steps
  if (value.movements.length !== steps.length) return false
  return value.movements.every((item, index) => object(item) && item.movementId === steps[index].movementId && validMobilityPrescription(item.prescription) && ['completed', 'skipped'].includes(item.status as string) && (item.prescription.kind === 'reps' ? item.actualTimedMs === null : typeof item.actualTimedMs === 'number' && Number.isFinite(item.actualTimedMs) && item.actualTimedMs >= 0 && item.actualTimedMs <= item.prescription.seconds * 1000))
}
export const mobilityHistoryName = (entry: MobilityHistoryEntry) => getMobilityRoutine(entry.routineId).name
export function mobilityHistoryTotals(entries: MobilityHistoryEntry[]) {
  const movements = entries.flatMap(entry => entry.movements)
  return { sessions: entries.length, completed: movements.filter(item => item.status === 'completed').length, prescribed: movements.length, seconds: entries.reduce((sum, entry) => sum + entry.durationSeconds, 0), days: new Set(entries.map(entry => localDayKey(entry.completedAt))).size }
}
export const mobilityToday = (entries: MobilityHistoryEntry[], today = new Date()) => entries.filter(entry => sameLocalDay(entry.completedAt, today))
export const mobilityMovedRegionsFromHistory = (entry: MobilityHistoryEntry) => new Set(entry.movements.filter(item => item.status === 'completed').flatMap(item => [...getMobilityMovement(item.movementId).primaryRegions]))
