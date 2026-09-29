import type { ProgramId } from '../types/program'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createRepositories, resetAllData } from '../lib/storage'
import type { ActiveSession, StorageResult } from '../lib/storage'
import type { ProfileDocument } from '../types/profile'
import { createSession, createProgramSession, restoreSession, sessionReducer } from '../lib/session'
import type { SessionAction } from '../lib/session'
import { createMobilitySession, mobilityReducer, restoreMobilitySession } from '../lib/mobility'
import type { MobilityAction } from '../lib/mobility'
import type { MobilityRoutineId } from '../types/mobility'
import { recordWeekSchedule } from '../lib/weekSnapshots'
export function useStretchStore() {
  const [initial] = useState(() => {
    const repositories = createRepositories()
    const profile = repositories.profile.load()
    const history = repositories.history.load()
    const active = repositories.active.load()
    const weeks = repositories.weeks.load()
    return { repositories, profile, history, active, weeks }
  })
  const repositories = useRef(initial.repositories)
  const [profile, setProfile] = useState(initial.profile.value)
  const [history, setHistory] = useState(initial.history.value)
  const [weeks, setWeeks] = useState(initial.weeks.value)
  const [active, setActive] = useState<ActiveSession | null>(initial.active.value ? initial.active.value.kind === 'mobility' ? restoreMobilitySession(initial.active.value) : restoreSession(initial.active.value) : null)
  const activeRef = useRef(active)
  const [notices, setNotices] = useState<string[]>([initial.profile.issue, initial.history.issue, initial.active.issue, initial.weeks.issue].filter((message): message is string => !!message))
  const report = useCallback((result: { issue: string | null }) => { if (result.issue) setNotices(previous => previous.includes(result.issue!) ? previous : [...previous, result.issue!]) }, [])
  const archive = useCallback((state: ActiveSession) => {
    const result = state.kind === 'mobility' ? repositories.current.history.finishMobility(state) : repositories.current.history.finish(state)
    setHistory(result.value); report(result)
    if (result.ok) report(repositories.current.active.clear())
    return result.ok
  }, [report])
  useEffect(() => {
    // A crash between explicit finish and history write can be recovered idempotently.
    if (activeRef.current?.phase === 'complete') archive(activeRef.current)
  }, [archive])
  const saveWeek = (schedule: ProfileDocument['profile']['weeklySchedule']) => {
    const current = repositories.current.weeks.load().value
    const updated = recordWeekSchedule(current, schedule)
    if (updated !== current) { const result = repositories.current.weeks.save(updated); setWeeks(result.value); report(result) }
  }
  const ensureWeek = () => { if (profile.onboarding.completed) saveWeek(profile.profile.weeklySchedule) }
  const saveProfile = (next: ProfileDocument) => { setProfile(next); report(repositories.current.profile.save(next)); if (next.onboarding.completed) saveWeek(next.profile.weeklySchedule) }
  const setSession = useCallback((next: ActiveSession) => {
    activeRef.current = next; setActive(next); report(repositories.current.active.save(next))
  }, [report])
  const start = (ids: string[], kind: 'targeted' | 'full-body') => {
    const next = createSession(ids, kind, profile.profile.preferences)
    setSession(next)
  }
  const startProgram = (programId: ProgramId) => setSession(createProgramSession(programId, profile.profile.preferences))
  const startMobility = (routineId: MobilityRoutineId) => setSession(createMobilitySession(routineId))
  const resume = () => { if (activeRef.current) setSession(activeRef.current.kind === 'mobility' ? restoreMobilitySession(activeRef.current) : restoreSession(activeRef.current)) }
  const dispatch = useCallback((action: SessionAction) => {
    const previous = activeRef.current
    if (!previous || previous.kind === 'mobility') return
    const next = sessionReducer(previous, action)
    if (previous === next) return
    activeRef.current = next; setActive(next)
    // Deadline is saved once; display-only ticks do not need synchronous storage writes.
    if (action.type !== 'TICK' || next.phase !== previous.phase) report(repositories.current.active.save(next))
    if (next.phase === 'complete') archive(next)
  }, [archive, report])
  const dispatchMobility = useCallback((action: MobilityAction) => {
    const previous = activeRef.current
    if (!previous || previous.kind !== 'mobility') return
    const next = mobilityReducer(previous, action)
    if (previous === next) return
    activeRef.current = next; setActive(next)
    if (action.type !== 'TICK' || next.phase !== previous.phase) report(repositories.current.active.save(next))
    if (next.phase === 'complete') archive(next)
  }, [archive, report])
  const discard = () => { activeRef.current = null; setActive(null); report(repositories.current.active.clear(true)) }
  const reset = (): StorageResult<ProfileDocument> => {
    const result = resetAllData(repositories.current.storage)
    if (!result.ok) { report(result); return { value: profile, ...result } }
    repositories.current = createRepositories(repositories.current.storage)
    const document = repositories.current.profile.load().value
    setProfile(document); setHistory([]); setWeeks([]); setActive(null); activeRef.current = null; setNotices([])
    return { value: document, ok: true, issue: null }
  }
  return { profile, history, weeks, active, notices, ensureWeek, saveProfile, start, startProgram, startMobility, resume, dispatch, dispatchMobility, discard, reset }
}
