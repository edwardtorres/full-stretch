import { defaultSchedule } from './schedule'
import { describe, expect, it } from 'vitest'
import { fullBodyIds } from '../data/stretches'
import type { StretchPreferences } from '../types/profile'
import { addAssessment, baselineAreas, baselineForRegion, createAssessment, defaultProfile, validProfile } from './profile'
import { createSession, prescribedStretch, restoreSession, sessionPlanSeconds, sessionReducer } from './session'
import type { SessionState } from './session'
import { holdSequence } from './stretch'
import { calfProgramIds, completedStretchIds, coveredRegionIds } from './coverage'
import { historicalSession, historyTotals, regionHistory, todayCompletedStretchIds, todayCoveredRegions, validHistoryEntry } from './history'
import { activeSessionRepository, historyRepository, profileRepository, resetAllData, storageKeys } from './storage'
import type { StoragePort } from './storage'
import { validActiveSession } from './sessionValidation'
const startTime = new Date(2026, 8, 27, 9).getTime()
const hamstringId = 'supine-hamstring-stretch'
function memoryStorage(): StoragePort & { values: Map<string, string> } {
  const values = new Map<string, string>()
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) }, removeItem: key => { values.delete(key) } }
}
function fullyFinish(ids = [hamstringId], kind: Parameters<typeof createSession>[1] = 'targeted', preferences: StretchPreferences = { holdSeconds: 30, sets: 2 }, id = 'finished-test'): SessionState {
  let state = createSession(ids, kind, preferences, startTime, id)
  let now = startTime
  for (const stretchId of ids) {
    for (const step of holdSequence(prescribedStretch(state, stretchId))) {
      state = sessionReducer(state, { type: 'START', now })
      now += step.seconds * 1000
      state = sessionReducer(state, { type: 'TICK', now })
      if (state.phase === 'transition') state = sessionReducer(state, { type: 'NEXT_HOLD' })
    }
    state = sessionReducer(state, { type: 'NEXT_STRETCH', now })
  }
  return state
}
const finished = fullyFinish()
const entry = historicalSession(finished)!
const allAnswers = Object.fromEntries(baselineAreas.map(area => [area.id, 'comfortable' as const]))
describe('profile and baseline', () => {
  it('defaults to flexibility, 30 sec, 2 sets and no invented baseline', () => expect(defaultProfile()).toEqual({ profile: { intentions: ['improve-flexibility'], preferences: { holdSeconds: 30, sets: 2 }, baseline: [], weeklySchedule: defaultSchedule() }, onboarding: { completed: false } }))
  it.each(['improve-flexibility', 'stay-consistent', 'unwind', 'complement-workouts'] as const)('supports %s intention', intention => {
    const profile = defaultProfile(); profile.profile.intentions = [intention]; expect(validProfile(profile)).toBe(true)
  })
  it('rejects unsupported intentions', () => { const profile = defaultProfile(); expect(validProfile({ ...profile, profile: { ...profile.profile, intentions: ['flexibility-score'] } })).toBe(false) })
  it.each([20, 30, 45])('supports %i second holds', holdSeconds => { const profile = defaultProfile(); expect(validProfile({ ...profile, profile: { ...profile.profile, preferences: { holdSeconds, sets: 2 } } })).toBe(true) })
  it.each([1, 2, 3])('supports %i sets', sets => { const profile = defaultProfile(); expect(validProfile({ ...profile, profile: { ...profile.profile, preferences: { holdSeconds: 30, sets } } })).toBe(true) })
  it('rejects unsupported prescriptions', () => {
    const profile = defaultProfile()
    for (const preferences of [{ holdSeconds: 0, sets: 2 }, { holdSeconds: 60, sets: 2 }, { holdSeconds: 30, sets: 0 }, { holdSeconds: 30, sets: 4 }]) expect(validProfile({ ...profile, profile: { ...profile.profile, preferences } })).toBe(false)
  })
  it.each(['comfortable', 'moderately-tight', 'very-tight', 'unsure'] as const)('records typed %s perceptions', perception => {
    const assessment = createAssessment(Object.fromEntries(baselineAreas.map(area => [area.id, perception])), new Date(startTime).toISOString(), 'baseline')
    expect(validProfile(addAssessment(defaultProfile(), assessment))).toBe(true)
    expect(assessment.results.every(result => result.perception === perception)).toBe(true)
  })
  it('skipping baseline completes setup without inventing results', () => { const profile = defaultProfile(); profile.onboarding.completed = true; expect(profile.profile.baseline).toEqual([]); expect(validProfile(profile)).toBe(true) })
  it('requires all questions to be explicitly answered', () => expect(() => createAssessment({ hamstrings: 'very-tight' })).toThrow())
  it('preserves original and latest answers through retest', () => {
    const original = createAssessment({ ...allAnswers, hamstrings: 'very-tight' }, new Date(startTime).toISOString(), 'original')
    const latest = createAssessment({ ...allAnswers, hamstrings: 'moderately-tight' }, new Date(startTime + 86400000).toISOString(), 'latest')
    const profile = addAssessment(addAssessment(defaultProfile(), original), latest)
    expect(profile.profile.baseline).toHaveLength(2)
    expect(baselineForRegion(profile.profile.baseline, 'hamstrings', 'original')?.perception).toBe('very-tight')
    expect(baselineForRegion(profile.profile.baseline, 'hamstrings')?.perception).toBe('moderately-tight')
    expect(addAssessment(profile, latest).profile.baseline).toHaveLength(2)
  })
  it('baseline produces experience records without objective scores or degrees', () => {
    const assessment = createAssessment(allAnswers)
    expect(assessment.results).toHaveLength(10)
    expect(Object.keys(assessment.results[0]).sort()).toEqual(['perception', 'recordedAt', 'regionId'])
    expect(JSON.stringify(assessment)).not.toMatch(/score|degrees|percentage|improved/i)
  })
})
describe('session prescription snapshots and recovery', () => {
  it('captures preferences without rewriting library defaults', () => {
    const preferences: StretchPreferences = { holdSeconds: 20, sets: 1 }
    const state = createSession([hamstringId], 'targeted', preferences, startTime)
    preferences.holdSeconds = 45; preferences.sets = 3
    expect(prescribedStretch(state).defaultHoldSeconds).toBe(20)
    expect(prescribedStretch(state).defaultSets).toBe(1)
  })
  it('new settings do not change an active session', () => {
    const old = createSession([hamstringId], 'targeted', { holdSeconds: 30, sets: 2 }, startTime)
    const next = createSession([hamstringId], 'targeted', { holdSeconds: 20, sets: 1 }, startTime)
    expect(sessionPlanSeconds(old)).toBe(120); expect(sessionPlanSeconds(next)).toBe(40)
  })
  it('recalculates full-body prescription totals', () => {
    expect(sessionPlanSeconds(createSession([...fullBodyIds], 'full-body', { holdSeconds: 30, sets: 2 }))).toBe(1260)
    expect(sessionPlanSeconds(createSession([...fullBodyIds], 'full-body', { holdSeconds: 20, sets: 1 }))).toBe(420)
    expect(sessionPlanSeconds(createSession([...fullBodyIds], 'full-body', { holdSeconds: 45, sets: 3 }))).toBe(2835)
  })
  it('restores active deadlines based on wall time', () => {
    const state = sessionReducer(createSession([hamstringId], 'targeted', undefined, startTime), { type: 'START', now: startTime })
    expect(restoreSession(state, startTime + 10000).remaining).toBe(20000)
  })
  it('expired recovery completes only the current hold', () => {
    const initial = sessionReducer(createSession([hamstringId], 'targeted', undefined, startTime), { type: 'START', now: startTime })
    const restored = restoreSession(initial, startTime + 500000)
    expect(restored.phase).toBe('transition'); expect(restored.holdIndex).toBe(0); expect(restored.results[hamstringId]).toHaveLength(1)
    expect(restored.remaining).toBe(0); expect(restored.deadline).toBeNull()
    expect(restoreSession(restored, startTime + 900000).results[hamstringId]).toHaveLength(1)
  })
  it('restores paused time without including reload time', () => {
    let state = createSession([hamstringId], 'targeted', undefined, startTime)
    state = sessionReducer(state, { type: 'START', now: startTime }); state = sessionReducer(state, { type: 'PAUSE', now: startTime + 11000 })
    expect(restoreSession(state, startTime + 86400000).remaining).toBe(19000)
  })
  it('validates ready, holding, paused, transition, complete and partial-finish state', () => {
    let state = createSession([hamstringId], 'targeted', undefined, startTime)
    expect(validActiveSession(state)).toBe(true)
    state = sessionReducer(state, { type: 'START', now: startTime }); expect(validActiveSession(state)).toBe(true)
    state = sessionReducer(state, { type: 'PAUSE', now: startTime + 5000 }); expect(validActiveSession(state)).toBe(true)
    state = sessionReducer(state, { type: 'RESUME', now: startTime + 10000 })
    state = sessionReducer(state, { type: 'TICK', now: startTime + 40000 }); expect(validActiveSession(state)).toBe(true)
    expect(validActiveSession(sessionReducer(state, { type: 'FINISH_EARLY', now: startTime + 40000 }))).toBe(true)
    expect(validActiveSession(finished)).toBe(true)
  })
  it('rejects malformed active indexes, results and deadlines', () => {
    const state = createSession([hamstringId], 'targeted', undefined, startTime)
    expect(validActiveSession({ ...state, holdIndex: 99 })).toBe(false)
    expect(validActiveSession({ ...state, phase: 'holding', deadline: null })).toBe(false)
    expect(validActiveSession({ ...state, results: { [hamstringId]: [{ step: { set: 1, side: 'right', seconds: 30 }, status: 'completed', heldMs: 30000 }] } })).toBe(false)
  })
})
describe('repositories and reset', () => {
  it('round-trips profile preferences and assessments', () => {
    const storage = memoryStorage(); const profile = addAssessment(defaultProfile(), createAssessment(allAnswers))
    profile.onboarding.completed = true; profile.profile.preferences = { holdSeconds: 45, sets: 3 }
    expect(profileRepository(storage).save(profile).ok).toBe(true)
    expect(profileRepository(storage).load().value).toEqual(profile)
  })
  it('recovers corrupt profile JSON and malformed profiles', () => {
    const storage = memoryStorage(); storage.setItem(storageKeys.profile, '{broken')
    expect(profileRepository(storage).load().value).toEqual(defaultProfile())
    storage.setItem(storageKeys.profile, JSON.stringify({ schemaVersion: 1, data: { profile: { preferences: { holdSeconds: 0 } } } }))
    expect(profileRepository(storage).load().issue).toBeTruthy()
  })
  it('missing data returns safe defaults', () => {
    const storage = memoryStorage(); expect(profileRepository(storage).load().value).toEqual(defaultProfile()); expect(historyRepository(storage).load().value).toEqual([]); expect(activeSessionRepository(storage).load().value).toBeNull()
  })
  it('retains future profile data without overwriting it', () => {
    const storage = memoryStorage(); const raw = JSON.stringify({ schemaVersion: 5, data: { future: true } }); storage.setItem(storageKeys.profile, raw)
    const repository = profileRepository(storage); expect(repository.load().issue).toMatch(/newer/)
    expect(repository.save(defaultProfile()).ok).toBe(false); expect(storage.getItem(storageKeys.profile)).toBe(raw)
  })
  it('remains usable in memory without storage', () => {
    const repository = profileRepository(null); const profile = defaultProfile(); profile.onboarding.completed = true
    expect(repository.load().issue).toBeTruthy(); expect(repository.save(profile).ok).toBe(false); expect(repository.load().value.onboarding.completed).toBe(true)
  })
  it('handles read and write failures without losing in-memory history', () => {
    const storage: StoragePort = { getItem() { throw new Error('Denied') }, setItem() { throw new Error('Quota') }, removeItem() { throw new Error('Denied') } }
    const repository = historyRepository(storage); expect(repository.load().issue).toBeTruthy()
    expect(repository.add(entry).ok).toBe(false); expect(repository.load().value).toEqual([entry])
    expect(repository.clear().ok).toBe(false)
  })
  it.each(['targeted', 'full-body'] as const)('round-trips active %s sessions', kind => {
    const storage = memoryStorage(); const state = createSession(kind === 'targeted' ? [hamstringId] : [...fullBodyIds], kind, { holdSeconds: 20, sets: 1 }, startTime)
    activeSessionRepository(storage).save(state); expect(activeSessionRepository(storage).load().value).toEqual(state)
  })
  it('round-trips an active hold and recovers its expired deadline', () => {
    const storage = memoryStorage(); const state = sessionReducer(createSession([hamstringId], 'targeted', undefined, startTime), { type: 'START', now: startTime })
    activeSessionRepository(storage).save(state)
    const restored = restoreSession(activeSessionRepository(storage).load().value!, startTime + 40000)
    expect(restored.phase).toBe('transition'); expect(restored.results[hamstringId][0].step.side).toBe('left')
  })
  it('recovers malformed active records', () => {
    const storage = memoryStorage(); storage.setItem(storageKeys.active, JSON.stringify({ schemaVersion: 1, data: { ...finished, holdIndex: 500 } }))
    expect(activeSessionRepository(storage).load().value).toBeNull()
  })
  it('round-trips completed history and deduplicates repeated finish actions', () => {
    const storage = memoryStorage(); const repository = historyRepository(storage)
    repository.finish(finished); repository.finish(finished)
    expect(historyRepository(storage).load().value).toEqual([entry])
  })
  it('does not save abandoned unfinished sessions', () => {
    const storage = memoryStorage(); const state = createSession([hamstringId], 'targeted', undefined, startTime)
    expect(historicalSession(state)).toBeNull(); historyRepository(storage).finish(state)
    expect(historyRepository(storage).load().value).toEqual([])
  })
  it('preserves valid history beside malformed records', () => {
    const storage = memoryStorage(); storage.setItem(storageKeys.history, JSON.stringify({ schemaVersion: 1, data: [entry, { id: 'bad' }, null, { ...entry, id: 'bad-duration', durationSeconds: -1 }] }))
    const result = historyRepository(storage).load(); expect(result.value).toEqual([entry]); expect(result.issue).toBeTruthy()
  })
  it('rejects mismatched historical region metadata and elapsed duration', () => {
    expect(validHistoryEntry({ ...entry, durationSeconds: entry.durationSeconds + 1 })).toBe(false)
    const wrongRegion = structuredClone(entry); wrongRegion.stretches[0].regionIds = ['calves']
    expect(validHistoryEntry(wrongRegion)).toBe(false)
  })
  it('handles corrupt and future history envelopes', () => {
    const storage = memoryStorage(); storage.setItem(storageKeys.history, 'not-json'); expect(historyRepository(storage).load().value).toEqual([])
    const raw = JSON.stringify({ schemaVersion: 3, data: [entry] }); storage.setItem(storageKeys.history, raw)
    const repository = historyRepository(storage); repository.load(); expect(repository.add(entry).ok).toBe(false); expect(storage.getItem(storageKeys.history)).toBe(raw)
  })
  it('reset removes only the three Full Stretch keys', () => {
    const storage = memoryStorage(); Object.values(storageKeys).forEach(key => storage.setItem(key, 'data')); storage.setItem('full-body:profile:v1', 'keep'); storage.setItem('unrelated', 'keep')
    expect(resetAllData(storage).ok).toBe(true); Object.values(storageKeys).forEach(key => expect(storage.getItem(key)).toBeNull()); expect(storage.getItem('full-body:profile:v1')).toBe('keep'); expect(storage.getItem('unrelated')).toBe('keep')
  })
  it('reports reset failure rather than claiming success', () => expect(resetAllData({ getItem: () => null, setItem: () => {}, removeItem: () => { throw new Error('denied') } }).ok).toBe(false))
})
describe('finished records and coverage', () => {
  it('stores partial and skipped time accurately on explicit early finish', () => {
    let state = createSession([hamstringId], 'targeted', { holdSeconds: 20, sets: 1 }, startTime, 'partial')
    state = sessionReducer(state, { type: 'START', now: startTime })
    state = sessionReducer(state, { type: 'FINISH_EARLY', now: startTime + 7000 })
    const partial = historicalSession(state)!
    expect(validHistoryEntry(partial)).toBe(true); expect(partial.durationSeconds).toBe(7)
    expect(partial.stretches[0].holds).toEqual([{ setNumber: 1, side: 'left', prescribedSeconds: 20, actualMilliseconds: 7000, status: 'skipped' }, { setNumber: 1, side: 'right', prescribedSeconds: 20, actualMilliseconds: 0, status: 'skipped' }])
    expect(partial.stretches[0].status).toBe('partial'); expect(todayCoveredRegions([partial], new Date(startTime)).size).toBe(0)
  })
  it('full-body early finish preserves completed stretches and skips the rest', () => {
    let state = createSession([...fullBodyIds], 'full-body', { holdSeconds: 20, sets: 1 }, startTime)
    for(let side=0;side<2;side++) { state = sessionReducer(state, { type: 'START', now: startTime + side * 20000 }); state = sessionReducer(state, { type: 'TICK', now: startTime + (side + 1) * 20000 }); if(side===0) state=sessionReducer(state, { type:'NEXT_HOLD' }) }
    state = sessionReducer(state, { type: 'FINISH_EARLY', now: startTime + 40000 })
    const record = historicalSession(state)!
    expect(validHistoryEntry(record)).toBe(true); expect(record.stretches[0].status).toBe('completed'); expect(record.stretches[1].status).toBe('partial'); expect(historyTotals([record]).holds).toBe(2); expect(record.stretches).toHaveLength(12)
  })
  it('keeps historical prescriptions after settings change', () => {
    const record = historicalSession(fullyFinish([hamstringId], 'targeted', { holdSeconds: 30, sets: 2 }))!
    createSession([hamstringId], 'targeted', { holdSeconds: 20, sets: 1 })
    expect(record.stretches[0].prescribedHoldSeconds).toBe(30); expect(record.stretches[0].prescribedSets).toBe(2); expect(record.stretches[0].holds).toHaveLength(4)
  })
  it('targeted calf completion identifies its stretch but does not cover the whole program', () => {
    const state = fullyFinish([calfProgramIds[0]])
    expect(completedStretchIds(state).has(calfProgramIds[0])).toBe(true); expect(coveredRegionIds(state).has('calves')).toBe(false)
  })
  it('full-body calves require both prescribed calf variations', () => {
    const complete = fullyFinish([...fullBodyIds], 'full-body')
    expect(coveredRegionIds(complete).has('calves')).toBe(true)
    const partial = structuredClone(complete); partial.results[calfProgramIds[1]][0].status='skipped'; partial.results[calfProgramIds[1]][0].heldMs=0
    expect(coveredRegionIds(partial).has('calves')).toBe(false); expect(coveredRegionIds(partial).has('hamstrings')).toBe(true)
  })
  it('combines two targeted calf variations for today coverage', () => {
    const straight = historicalSession(fullyFinish([calfProgramIds[0]], 'targeted', undefined, 'straight'))!
    const bent = historicalSession(fullyFinish([calfProgramIds[1]], 'targeted', undefined, 'bent'))!
    expect(todayCoveredRegions([straight],new Date(startTime)).has('calves')).toBe(false)
    expect(todayCoveredRegions([straight,bent],new Date(startTime)).has('calves')).toBe(true)
  })
  it('other full-body regions require their prescribed stretch', () => {
    const state = fullyFinish([...fullBodyIds], 'full-body'); state.results['supine-hamstring-stretch'][0].status='skipped'; state.results['supine-hamstring-stretch'][0].heldMs=0
    expect(coveredRegionIds(state).has('hamstrings')).toBe(false); expect(coveredRegionIds(state).has('glutes')).toBe(true)
  })
  it('today retains completed regions and excludes yesterday', () => {
    const today = new Date(startTime); const yesterday = { ...entry, id: 'yesterday', completedAt: new Date(startTime - 86400000).toISOString() }
    expect(todayCompletedStretchIds([entry], today).has(hamstringId)).toBe(true); expect(todayCoveredRegions([entry], today).has('hamstrings')).toBe(true); expect(todayCoveredRegions([yesterday], today).has('hamstrings')).toBe(false)
  })
  it('calculates region totals without counting unrelated stretches', () => {
    const glutes = historicalSession(fullyFinish(['supine-figure-four-stretch'], 'targeted', undefined, 'glutes'))!
    const second = { ...entry, id:'second', completedAt:new Date(startTime + 86400000).toISOString() }
    const totals = regionHistory([entry,glutes,second],'hamstrings')
    expect(totals.sessions).toBe(2); expect(totals.holds).toBe(8); expect(totals.holdSeconds).toBe(240); expect(totals.days).toBe(2); expect(totals.lastStretched).toBe(second.completedAt)
  })
  it('does not count an all-skipped region as last stretched or a completed day', () => {
    const record=historicalSession(sessionReducer(createSession([hamstringId],'targeted',undefined,startTime),{type:'FINISH_EARLY',now:startTime}))!
    expect(regionHistory([record],'hamstrings').lastStretched).toBeNull(); expect(historyTotals([record]).days).toBe(0)
  })
})
