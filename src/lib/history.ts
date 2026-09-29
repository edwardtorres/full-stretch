import { getProgram, isProgramId } from './programs'
import type { ProgramId } from '../types/program'
import type { StretchHistoryEntry } from '../types/history'
import type { SessionState } from './session'
import type { RegionId } from '../types/stretch'
import { getStretch, holdSequence, isStretchComplete } from './stretch'
import { prescribedStretch } from './session'
import { isoInstant, object } from './profile'
import { sameLocalDay, localDayKey } from './dates'
import { regionCoverage, programRegionCoverage } from './coverage'
export function historicalSession(state: SessionState): StretchHistoryEntry | null {
  if (state.phase !== 'complete' || !state.completedAt) return null
  return { id: state.id, sessionType: state.kind, programId: state.programId, startedAt: state.startedAt, completedAt: state.completedAt, durationSeconds: Math.max(0, Math.floor((Date.parse(state.completedAt) - Date.parse(state.startedAt)) / 1000)), stretches: state.ids.map(id => {
    const stretch = prescribedStretch(state, id)
    return { stretchId: id, regionIds: [...stretch.primaryRegions], prescribedHoldSeconds: stretch.defaultHoldSeconds, prescribedSets: stretch.defaultSets, status: isStretchComplete(stretch, state.results[id]) ? 'completed' : 'partial', holds: (state.results[id] ?? []).map(result => ({ setNumber: result.step.set, side: result.step.side, prescribedSeconds: result.step.seconds, actualMilliseconds: result.heldMs, status: result.status })) }
  }) }
}
export function validHistoryEntry(value: unknown): value is StretchHistoryEntry {
  if (!object(value) || typeof value.id !== 'string' || !value.id || !['targeted', 'program', 'full-body'].includes(value.sessionType as string) || !isoInstant(value.startedAt) || !isoInstant(value.completedAt) || Date.parse(value.completedAt) < Date.parse(value.startedAt) || !Number.isInteger(value.durationSeconds) || value.durationSeconds !== Math.floor((Date.parse(value.completedAt) - Date.parse(value.startedAt)) / 1000) || !Array.isArray(value.stretches) || !value.stretches.length || new Set(value.stretches.map(item => object(item) ? item.stretchId : null)).size !== value.stretches.length || (value.sessionType === 'targeted' && value.stretches.length !== 1)) return false
  if (value.sessionType === 'program') {
    if (!isProgramId(value.programId)) return false
    const expected = getProgram(value.programId).stretchIds
    if (value.stretches.length !== expected.length || value.stretches.some((stretch, index) => !object(stretch) || stretch.stretchId !== expected[index])) return false
  } else if (value.sessionType === 'targeted' && value.programId != null) return false
  return value.stretches.every(item => {
    if (!object(item) || typeof item.stretchId !== 'string' || ![20, 30, 45].includes(item.prescribedHoldSeconds as number) || ![1, 2, 3].includes(item.prescribedSets as number) || !Array.isArray(item.regionIds) || !item.regionIds.length || !Array.isArray(item.holds) || !['completed', 'partial'].includes(item.status as string)) return false
    let canonical
    try { canonical = getStretch(item.stretchId) } catch { return false }
    if (item.regionIds.length !== canonical.primaryRegions.length || !item.regionIds.every((id, index) => id === canonical.primaryRegions[index])) return false
    const sequence = holdSequence({ ...canonical, defaultHoldSeconds: item.prescribedHoldSeconds as number, defaultSets: item.prescribedSets as number })
    return item.holds.length === sequence.length && item.holds.every((hold, index) => object(hold) && hold.setNumber === sequence[index].set && hold.side === sequence[index].side && hold.prescribedSeconds === sequence[index].seconds && ['completed', 'skipped'].includes(hold.status as string) && typeof hold.actualMilliseconds === 'number' && Number.isFinite(hold.actualMilliseconds) && hold.actualMilliseconds >= 0 && hold.actualMilliseconds <= sequence[index].seconds * 1000 && (hold.status !== 'completed' || hold.actualMilliseconds === sequence[index].seconds * 1000)) && (item.status === 'completed') === item.holds.every(hold => object(hold) && hold.status === 'completed')
  })
}
export const newestHistory = (entries: StretchHistoryEntry[]) => [...entries].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
export function historyTotals(entries: StretchHistoryEntry[]) {
  const stretches = entries.flatMap(entry => entry.stretches)
  const holds = stretches.flatMap(stretch => stretch.holds)
  return { sessions: entries.length, stretches: stretches.filter(stretch => stretch.status === 'completed').length, prescribedStretches: stretches.length, holds: holds.filter(hold => hold.status === 'completed').length, prescribedHolds: holds.length, holdSeconds: Math.floor(holds.reduce((sum, hold) => sum + hold.actualMilliseconds, 0) / 1000), days: new Set(entries.filter(entry => entry.stretches.some(stretch => stretch.status === 'completed')).map(entry => localDayKey(entry.completedAt))).size }
}
export function todayCompletedStretchIds(entries: StretchHistoryEntry[], today = new Date()): Set<string> {
  return new Set(entries.filter(entry => sameLocalDay(entry.completedAt, today)).flatMap(entry => entry.stretches.filter(stretch => stretch.status === 'completed').map(stretch => stretch.stretchId)))
}
export function todayCoveredRegions(entries: StretchHistoryEntry[], today = new Date()) {
  const todays = entries.filter(entry => sameLocalDay(entry.completedAt, today))
  const ids = todayCompletedStretchIds(todays, today)
  // Library coverage can combine targeted stretches; program coverage uses its included list.
  const covered = regionCoverage(ids, [...ids])
  for (const programId of new Set(todays.filter(entry => entry.sessionType === 'program').map(entry => entry.programId!))) {
    const matching = todays.filter(entry => entry.programId === programId)
    const included = [...new Set(matching.flatMap(entry => entry.stretches.map(stretch => stretch.stretchId)))]
    const complete = new Set(matching.flatMap(entry => entry.stretches.filter(stretch => stretch.status === 'completed').map(stretch => stretch.stretchId)))
    programRegionCoverage(complete, included).forEach(region => covered.add(region))
  }
  return covered
}
export function normalizeHistoricalProgram(value: unknown): StretchHistoryEntry | null {
  if (!validHistoryEntry(value)) return null
  const raw = value as unknown as Record<string, unknown>
  return { ...value, sessionType: raw.sessionType === 'full-body' ? 'program' : value.sessionType, programId: raw.sessionType === 'full-body' ? 'full-20' : value.programId ?? null }
}
export type HistoryProgramFilter = 'all' | 'targeted' | ProgramId
export const filterProgramHistory = (entries: StretchHistoryEntry[], filter: HistoryProgramFilter) => filter === 'all' ? entries : entries.filter(entry => filter === 'targeted' ? entry.sessionType === 'targeted' : entry.programId === filter)
export const historySessionName = (entry: StretchHistoryEntry) => entry.sessionType === 'program' && entry.programId ? getProgram(entry.programId).name : 'Targeted'
export function regionHistory(entries: StretchHistoryEntry[], region: RegionId) {
  const relevant = newestHistory(entries.filter(entry => entry.stretches.some(stretch => stretch.regionIds.includes(region))))
  const onlyRegion = relevant.map(entry => ({ ...entry, stretches: entry.stretches.filter(stretch => stretch.regionIds.includes(region)) }))
  const lastStretched = relevant.find(entry => entry.stretches.some(stretch => stretch.regionIds.includes(region) && stretch.holds.some(hold => hold.actualMilliseconds > 0)))?.completedAt ?? null
  return { entries: relevant, lastStretched, ...historyTotals(onlyRegion) }
}
