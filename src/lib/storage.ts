import type { ProfileDocument } from '../types/profile'
import type { HistoryEntry } from '../types/history'
import type { SessionState } from './session'
import type { MobilitySessionState } from './mobility'
import { defaultProfile, object, normalizeProfile } from './profile'
import { validHistoryEntry, newestHistory, historicalSession, normalizeHistoricalProgram } from './history'
import { normalizeActiveSession } from './sessionValidation'
import { validMobilitySession } from './mobility'
import { historicalMobilitySession, validMobilityHistory } from './mobilityHistory'
import type { WeekSnapshot } from './weekSnapshots'
import { validWeekSnapshots } from './weekSnapshots'
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export const storageKeys = { profile: 'full-stretch:profile:v1', history: 'full-stretch:history:v1', active: 'full-stretch:active-session:v1', weeks: 'full-stretch:week-snapshots:v1' } as const
export function browserStorage(): StoragePort | null {
  try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null }
}
export interface StorageResult<T> { value: T; issue: string | null; ok: boolean }
type Decoded<T> = { value: T; issue?: string } | null
function versionedRepository<T>(storage: StoragePort | null, key: string, label: string, initial: () => T, decode: (value: unknown) => Decoded<T>, schema = 3) {
  let memory = initial()
  let loaded = false
  let future = false
  let readIssue: string | null = null
  const load = (): StorageResult<T> => {
    if (loaded) return { value: structuredClone(memory), issue: readIssue, ok: readIssue === null }
    loaded = true
    try {
      if (!storage) throw new Error('Storage unavailable')
      const raw = storage.getItem(key)
      if (!raw) return { value: structuredClone(memory), issue: null, ok: true }
      const envelope: unknown = JSON.parse(raw)
      if (object(envelope) && typeof envelope.schemaVersion === 'number' && envelope.schemaVersion > schema) {
        future = true
        readIssue = `Saved ${label} belongs to a newer app version. It has been kept; this tab will use temporary data.`
      } else {
        const decoded = object(envelope) && Number.isInteger(envelope.schemaVersion) && (envelope.schemaVersion as number) >= 1 && (envelope.schemaVersion as number) <= schema ? decode(envelope.data) : null
        if (!decoded) readIssue = `Saved ${label} could not be restored. You can continue with temporary data in this tab.`
        else { memory = structuredClone(decoded.value); readIssue = decoded.issue ?? null }
      }
    } catch { readIssue = `${label[0].toUpperCase() + label.slice(1)} storage is unavailable or unreadable. This tab still works; changes may be lost on reload.` }
    return { value: structuredClone(memory), issue: readIssue, ok: readIssue === null }
  }
  const save = (value: T): StorageResult<T> => {
    if (!loaded) load()
    memory = structuredClone(value)
    let issue: string | null = null
    try {
      if (future) throw new Error('Future version')
      if (!storage) throw new Error('Storage unavailable')
      storage.setItem(key, JSON.stringify({ schemaVersion: schema, data: memory }))
    } catch { issue = future ? `Saved ${label} belongs to a newer version and has been kept. Your changes are available in this tab only.` : `${label[0].toUpperCase() + label.slice(1)} could not be saved. Your changes are available in this tab only.` }
    return { value: structuredClone(memory), issue, ok: issue === null }
  }
  const clear = (allowFuture = false): StorageResult<T> => {
    memory = initial(); loaded = true
    try {
      if (future && !allowFuture) throw new Error('Future version')
      if (!storage) throw new Error('Storage unavailable')
      storage.removeItem(key); future = false; readIssue = null
      return { value: structuredClone(memory), issue: null, ok: true }
    } catch { return { value: structuredClone(memory), issue: `${label[0].toUpperCase() + label.slice(1)} could not be removed from this browser. It may return on reload.`, ok: false } }
  }
  return { load, save, clear }
}
export function profileRepository(storage: StoragePort | null) {
  return versionedRepository<ProfileDocument>(storage, storageKeys.profile, 'profile', defaultProfile, value => { const normalized = normalizeProfile(value); return normalized ? { value: normalized } : null })
}
export function activeSessionRepository(storage: StoragePort | null) {
  return versionedRepository<SessionState | null>(storage, storageKeys.active, 'active stretch', () => null, value => { const normalized = normalizeActiveSession(value); return normalized !== undefined ? { value: normalized } : null })
}
export type ActiveSession = SessionState | MobilitySessionState
export function activitySessionRepository(storage: StoragePort | null) {
  return versionedRepository<ActiveSession | null>(storage, storageKeys.active, 'active session', () => null, value => {
    if (value === null) return { value: null }
    if (object(value) && value.kind === 'mobility') return validMobilitySession(value) ? { value } : null
    const normalized = normalizeActiveSession(value)
    return normalized !== undefined ? { value: normalized } : null
  })
}
export function historyRepository(storage: StoragePort | null) {
  const repository = versionedRepository<HistoryEntry[]>(storage, storageKeys.history, 'session history', () => [], value => {
    if (!Array.isArray(value)) return null
    const valid = value.map(entry => validMobilityHistory(entry) ? entry : normalizeHistoricalProgram(entry)).filter((entry): entry is HistoryEntry => entry !== null)
    const unique = valid.filter((entry, index) => valid.findIndex(item => item.id === entry.id) === index)
    return { value: newestHistory(unique), issue: unique.length !== value.length ? 'Some saved history records could not be restored. Valid sessions have been kept.' : undefined }
  })
  const add = (entry: HistoryEntry) => {
    const existing = repository.load().value
    if (!(entry.activityType === 'mobility' ? validMobilityHistory(entry) : validHistoryEntry(entry))) return { value: existing, ok: false, issue: 'This session could not be saved as valid history.' }
    // Re-saving the same ID also retries a failed storage write, without duplication.
    return repository.save(newestHistory(existing.some(item => item.id === entry.id) ? existing : [...existing, entry]))
  }
  const finish = (state: SessionState) => {
    const entry = historicalSession(state)
    return entry ? add(entry) : { value: repository.load().value, issue: null, ok: true }
  }
  const finishMobility = (state: MobilitySessionState) => {
    const entry = historicalMobilitySession(state)
    return entry ? add(entry) : { value: repository.load().value, issue: null, ok: true }
  }
  return { ...repository, add, finish, finishMobility }
}
export function weekSnapshotRepository(storage: StoragePort | null) {
  return versionedRepository<WeekSnapshot[]>(storage, storageKeys.weeks, 'week snapshots', () => [], value => validWeekSnapshots(value) ? { value } : null, 1)
}
export function resetAllData(storage: StoragePort | null): { ok: boolean; issue: string | null } {
  if (!storage) return { ok: false, issue: 'Browser storage is unavailable. Data could not be removed.' }
  try { for (const key of Object.values(storageKeys)) storage.removeItem(key); return { ok: true, issue: null } }
  catch { return { ok: false, issue: 'Some Full Stretch data could not be removed. Try resetting again when browser storage is available.' } }
}
export const createRepositories = (storage = browserStorage()) => ({ storage, profile: profileRepository(storage), history: historyRepository(storage), active: activitySessionRepository(storage), weeks: weekSnapshotRepository(storage) })
