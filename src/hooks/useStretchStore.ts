import { useCallback, useEffect, useRef, useState } from 'react'
import { createRepositories, resetAllData } from '../lib/storage'
import type { StorageResult } from '../lib/storage'
import type { ProfileDocument } from '../types/profile'
import { createSession, restoreSession, sessionReducer } from '../lib/session'
import type { SessionAction, SessionState } from '../lib/session'
export function useStretchStore() {
  const [initial] = useState(() => {
    const repositories = createRepositories()
    const profile = repositories.profile.load()
    const history = repositories.history.load()
    const active = repositories.active.load()
    return { repositories, profile, history, active }
  })
  const repositories = useRef(initial.repositories)
  const [profile, setProfile] = useState(initial.profile.value)
  const [history, setHistory] = useState(initial.history.value)
  const [active, setActive] = useState<SessionState | null>(initial.active.value ? restoreSession(initial.active.value) : null)
  const activeRef = useRef(active)
  const [notices, setNotices] = useState<string[]>([initial.profile.issue, initial.history.issue, initial.active.issue].filter((message): message is string => !!message))
  const report = useCallback((result: { issue: string | null }) => { if (result.issue) setNotices(previous => previous.includes(result.issue!) ? previous : [...previous, result.issue!]) }, [])
  const archive = useCallback((state: SessionState) => {
    const result = repositories.current.history.finish(state)
    setHistory(result.value); report(result)
    if (result.ok) report(repositories.current.active.clear())
    return result.ok
  }, [report])
  useEffect(() => {
    // A crash between explicit finish and history write can be recovered idempotently.
    if (activeRef.current?.phase === 'complete') archive(activeRef.current)
  }, [archive])
  const saveProfile = (next: ProfileDocument) => { setProfile(next); report(repositories.current.profile.save(next)) }
  const setSession = useCallback((next: SessionState) => {
    activeRef.current = next; setActive(next); report(repositories.current.active.save(next))
  }, [report])
  const start = (ids: string[], kind: SessionState['kind']) => {
    const next = createSession(ids, kind, profile.profile.preferences)
    setSession(next)
  }
  const resume = () => { if (activeRef.current) setSession(restoreSession(activeRef.current)) }
  const dispatch = useCallback((action: SessionAction) => {
    const previous = activeRef.current
    if (!previous) return
    const next = sessionReducer(previous, action)
    if (previous === next) return
    activeRef.current = next; setActive(next)
    // Deadline is saved once; display-only ticks do not need synchronous storage writes.
    if (action.type !== 'TICK' || next.phase !== previous.phase) report(repositories.current.active.save(next))
    if (next.phase === 'complete') archive(next)
  }, [archive, report])
  const discard = () => { activeRef.current = null; setActive(null); report(repositories.current.active.clear(true)) }
  const reset = (): StorageResult<ProfileDocument> => {
    const result = resetAllData(repositories.current.storage)
    if (!result.ok) { report(result); return { value: profile, ...result } }
    repositories.current = createRepositories(repositories.current.storage)
    const document = repositories.current.profile.load().value
    setProfile(document); setHistory([]); setActive(null); activeRef.current = null; setNotices([])
    return { value: document, ok: true, issue: null }
  }
  return { profile, history, active, notices, saveProfile, start, resume, dispatch, discard, reset }
}
