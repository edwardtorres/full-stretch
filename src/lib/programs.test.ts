import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { programs } from '../data/programs'
import { fullBodyIds } from '../data/stretches'
import { programIds } from '../types/program'
import type { ProgramId } from '../types/program'
import type { StretchPreferences } from '../types/profile'
import { weekdays } from '../types/schedule'
import { getProgram, getProgramCoveredRegions, getProgramHoldCount, getProgramPlannedHoldTime } from './programs'
import { createProgramSession, createSession, sessionReducer, sessionHoldSequence, sessionPlanSeconds, restoreSession } from './session'
import type { SessionState } from './session'
import { getStretch } from './stretch'
import { completedStretchIds, coveredRegionIds, programRegionCoverage, regionCoverage, calfProgramIds } from './coverage'
import { historicalSession, normalizeHistoricalProgram, validHistoryEntry, todayCoveredRegions, historyTotals, filterProgramHistory, historySessionName } from './history'
import { defaultSchedule, getScheduledProgramForDate, getWeeklySchedule, isScheduledProgramCompleted, weeklyCompletedCount, normalizeSchedule } from './schedule'
import { defaultProfile, addAssessment, createAssessment, baselineAreas } from './profile'
import { activeSessionRepository, historyRepository, profileRepository, storageKeys } from './storage'
import { isFlexibilityHistory } from './mobilityHistory'
import type { StoragePort } from './storage'
import { normalizeActiveSession, validActiveSession } from './sessionValidation'
const previousTimezone = process.env.TZ
beforeAll(() => { process.env.TZ = 'America/Los_Angeles' })
afterAll(() => { process.env.TZ = previousTimezone })
const normal = { holdSeconds: 30, sets: 2 } as const
const short = { holdSeconds: 20, sets: 1 } as const
const tuesday = () => new Date(2026, 8, 29, 9)
const storage = (): StoragePort & { values: Map<string, string> } => {
  const values = new Map<string, string>()
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) }, removeItem: key => { values.delete(key) } }
}
function finish(state: SessionState) {
  let next = state; let now = Date.parse(state.startedAt)
  for (const id of state.ids) {
    for (const hold of sessionHoldSequence(state, id)) {
      next = sessionReducer(next, { type: 'START', now }); now += hold.seconds * 1000
      next = sessionReducer(next, { type: 'TICK', now })
      if (next.phase === 'transition') next = sessionReducer(next, { type: 'NEXT_HOLD' })
    }
    next = sessionReducer(next, { type: 'NEXT_STRETCH', now })
  }
  return next
}
const record = (id: ProgramId, date = tuesday(), sessionId: string = crypto.randomUUID(), preferences: StretchPreferences = normal) => historicalSession(finish(createProgramSession(id, preferences, date.getTime(), sessionId)))!
describe('program definitions and prescription', () => {
  it('has stable unique program IDs', () => { expect(programs.map(program => program.id)).toEqual(programIds); expect(new Set(programIds).size).toBe(3) })
  it.each(programIds)('%s uses valid unique stretch IDs and deliberate positions', id => {
    const program = getProgram(id)
    expect(new Set(program.stretchIds).size).toBe(program.stretchIds.length)
    const positionRank = { standing: 0, kneeling: 1, seated: 2, floor: 2 }
    const positions = program.stretchIds.map(stretchId => positionRank[getStretch(stretchId).position])
    expect(positions).toEqual([...positions].sort())
  })
  it.each([['quick-5', 5], ['daily-10', 8], ['full-20', 12]] as const)('%s has %i movements', (id, count) => expect(getProgram(id).stretchIds).toHaveLength(count))
  it('keeps the comprehensive sequence intact', () => expect(getProgram('full-20').stretchIds).toEqual(fullBodyIds))
  it.each([['quick-5', 16, 480, 8, 160], ['daily-10', 24, 720, 12, 240], ['full-20', 42, 1260, 21, 420]] as const)('%s calculates sides/sets at 30 × 2 and 20 × 1', (id, holds, seconds, shortHolds, shortSeconds) => {
    expect(getProgramHoldCount(id, normal)).toBe(holds); expect(getProgramPlannedHoldTime(id, normal)).toBe(seconds)
    expect(getProgramHoldCount(id, short)).toBe(shortHolds); expect(getProgramPlannedHoldTime(id, short)).toBe(shortSeconds)
  })
  it('changes movement count without changing the user hold prescription', () => {
    for (const programId of programIds) {
      const state = createProgramSession(programId, normal)
      expect(Object.values(state.prescriptions).every(p => p.holdSeconds === 30 && p.sets === 2)).toBe(true)
    }
  })
  it('captures program ID, list, prescription, sequence, unique ID and start time', () => {
    const preferences: StretchPreferences = { ...normal }
    const state = createProgramSession('quick-5', preferences, tuesday().getTime(), 'captured')
    preferences.holdSeconds = 45; preferences.sets = 3
    expect(state.kind).toBe('program'); expect(state.programId).toBe('quick-5'); expect(state.ids).toEqual(getProgram('quick-5').stretchIds)
    expect(state.id).toBe('captured'); expect(state.startedAt).toBe(tuesday().toISOString()); expect(sessionHoldSequence(state)[0]).toEqual({ set: 1, side: 'left', seconds: 30 })
    expect(sessionPlanSeconds(state)).toBe(480)
  })
  it('new preferences change only new sessions', () => {
    const old = createProgramSession('daily-10', normal)
    const next = createProgramSession('daily-10', short)
    expect(sessionPlanSeconds(old)).toBe(720); expect(sessionPlanSeconds(next)).toBe(240)
    expect(getStretch('cross-body-shoulder-stretch').defaultHoldSeconds).toBe(30)
  })
})
describe('program coverage and history', () => {
  it('Quick 5 covers only its included primary regions', () => {
    const state = finish(createProgramSession('quick-5', normal))
    expect(coveredRegionIds(state)).toEqual(new Set(['shoulders', 'lats', 'calves', 'hamstrings', 'adductors']))
    expect(getProgramCoveredRegions('quick-5')).toEqual(['shoulders', 'lats', 'calves', 'hamstrings', 'adductors'])
    expect(coveredRegionIds(state).has('chest')).toBe(false); expect(coveredRegionIds(state).has('upper-back')).toBe(false)
  })
  it.each(['quick-5', 'daily-10'] as const)('%s permits included single-calf program coverage, separate from library coverage', programId => {
    const state = finish(createProgramSession(programId, normal))
    expect(coveredRegionIds(state).has('calves')).toBe(true)
    expect(regionCoverage(completedStretchIds(state), state.ids).has('calves')).toBe(false)
  })
  it('Full 20 requires both calf variations, including every hold', () => {
    const state = finish(createProgramSession('full-20', normal))
    expect(coveredRegionIds(state).has('calves')).toBe(true)
    state.results[calfProgramIds[1]][0] = { ...state.results[calfProgramIds[1]][0], status: 'skipped', heldMs: 6000 }
    expect(coveredRegionIds(state).has('calves')).toBe(false)
  })
  it('no included coverage is earned by a skipped stretch', () => {
    const state = finish(createProgramSession('quick-5', normal))
    state.results[state.ids[0]][0].status = 'skipped'
    expect(coveredRegionIds(state).has('shoulders')).toBe(false)
  })
  it('all included stretches are required for a multi-stretch program region', () => expect(programRegionCoverage(new Set([calfProgramIds[0]]), [...calfProgramIds]).has('calves')).toBe(false))
  it('new history stores program ID and actual prescribed/result time', () => {
    const entry = record('daily-10')
    expect(entry.sessionType).toBe('program'); expect(entry.programId).toBe('daily-10'); expect(validHistoryEntry(entry)).toBe(true)
    expect(historyTotals([entry])).toMatchObject({ sessions: 1, holds: 24, stretches: 8, holdSeconds: 720 })
  })
  it('normalizes Phase 2 full-body history to Full 20 without changing source bytes', () => {
    const current = record('full-20'); const { programId: _, ...legacyBase } = current
    const legacy = { ...legacyBase, sessionType: 'full-body' }; const raw = JSON.stringify({ schemaVersion: 1, data: [legacy] })
    const port = storage(); port.setItem(storageKeys.history, raw)
    const result = historyRepository(port).load().value.filter(isFlexibilityHistory)[0]
    expect(result.programId).toBe('full-20'); expect(historySessionName(result)).toBe('Full 20'); expect(result.stretches).toEqual(legacy.stretches)
    expect(port.getItem(storageKeys.history)).toBe(raw); expect(normalizeHistoricalProgram(legacy)).toEqual(result)
  })
  it('keeps old targeted history valid and leaves its prescription unchanged', () => {
    const current = historicalSession(finish(createSession(['supine-hamstring-stretch'], 'targeted', normal, tuesday().getTime())))!
    const { programId: _, ...legacy } = current
    const normalized = normalizeHistoricalProgram(legacy)!
    expect(normalized.sessionType).toBe('targeted'); expect(normalized.programId).toBeNull(); expect(normalized.stretches[0].prescribedSets).toBe(2)
  })
  it('preserves old history and new records together on save', () => {
    const old = record('full-20'); const { programId: _, ...base } = old
    const port = storage(); port.setItem(storageKeys.history, JSON.stringify({ schemaVersion: 1, data: [{ ...base, sessionType: 'full-body' }] }))
    const repository = historyRepository(port); repository.add(record('quick-5'))
    const entries = historyRepository(port).load().value
    expect(entries.filter(entry => entry.activityType === 'flexibility').map(entry => entry.programId).sort()).toEqual(['full-20', 'quick-5']); expect(JSON.parse(port.getItem(storageKeys.history)!).schemaVersion).toBe(3)
  })
  it('history remains a captured prescription after defaults change', () => {
    const old = record('quick-5'); createProgramSession('quick-5', short)
    expect(old.stretches[0].holds).toHaveLength(4); expect(old.stretches[0].prescribedHoldSeconds).toBe(30)
  })
  it('supports multiple same-day sessions and aggregates program/targeted coverage', () => {
    const quick = record('quick-5')
    const targeted = historicalSession(finish(createSession(['supine-figure-four-stretch'], 'targeted', normal, tuesday().getTime())))!
    const port = storage(); const repository = historyRepository(port); repository.add(quick); repository.add(targeted)
    expect(repository.load().value).toHaveLength(2); expect(todayCoveredRegions(repository.load().value.filter(isFlexibilityHistory), tuesday())).toEqual(new Set(['shoulders', 'lats', 'calves', 'hamstrings', 'adductors', 'glutes']))
  })
  it('aggregates complementary same-program results without counting unfinished stretches', () => {
    const first = record('full-20'); const second = structuredClone(first); second.id = 'other'
    first.stretches.find(stretch => stretch.stretchId === calfProgramIds[1])!.status = 'partial'
    second.stretches.find(stretch => stretch.stretchId === calfProgramIds[0])!.status = 'partial'
    expect(todayCoveredRegions([first], tuesday()).has('calves')).toBe(false)
    expect(todayCoveredRegions([first, second], tuesday()).has('calves')).toBe(true)
  })
  it('filters program and targeted history without removing exact stretch detail', () => {
    const quick = record('quick-5'); const daily = record('daily-10')
    const targeted = historicalSession(finish(createSession(['supine-hamstring-stretch'], 'targeted', normal, tuesday().getTime())))!
    const entries = [quick, daily, targeted]
    expect(filterProgramHistory(entries, 'all')).toEqual(entries); expect(filterProgramHistory(entries, 'quick-5')).toEqual([quick]); expect(filterProgramHistory(entries, 'targeted')).toEqual([targeted]); expect(filterProgramHistory(entries, 'full-20')).toEqual([])
    expect(filterProgramHistory(entries, 'daily-10')[0].stretches).toHaveLength(8)
  })
})
describe('schedule persistence and local occurrences', () => {
  it('defaults to Tuesday/Thursday Daily 10 and Saturday Full 20 with all days explicit', () => {
    expect(defaultSchedule()).toEqual(weekdays.map(weekday => ({ weekday, programId: weekday === 'tuesday' || weekday === 'thursday' ? 'daily-10' : weekday === 'saturday' ? 'full-20' : null })))
  })
  it('round-trips a changed schedule in the profile', () => {
    const profile = defaultProfile(); profile.profile.weeklySchedule[1].programId = 'quick-5'
    const port = storage(); profileRepository(port).save(profile)
    expect(profileRepository(port).load().value.profile.weeklySchedule).toEqual(profile.profile.weeklySchedule)
  })
  it('adds the modest schedule to old profiles without rewriting baseline or storage', () => {
    const assessment = createAssessment(Object.fromEntries(baselineAreas.map(area => [area.id, 'very-tight' as const])))
    const current = addAssessment(defaultProfile(), assessment); const { weeklySchedule: _, ...oldProfile } = current.profile
    const raw = JSON.stringify({ schemaVersion: 1, data: { ...current, profile: oldProfile } }); const port = storage(); port.setItem(storageKeys.profile, raw)
    const next = profileRepository(port).load().value
    expect(next.profile.weeklySchedule).toEqual(defaultSchedule()); expect(next.profile.baseline).toEqual([assessment]); expect(port.getItem(storageKeys.profile)).toBe(raw)
  })
  it('normalizes missing/malformed schedule days without dropping the profile', () => {
    const partial = normalizeSchedule([{ weekday: 'tuesday', programId: 'quick-5' }, { weekday: 'friday', programId: 'unknown' }])
    expect(partial).toHaveLength(7); expect(partial[1].programId).toBe('quick-5'); expect(partial[4].programId).toBeNull(); expect(partial[0].programId).toBeNull()
  })
  it('selects the local weekday, including an instant with a different UTC date', () => {
    expect(getScheduledProgramForDate(defaultSchedule(), tuesday())).toBe('daily-10')
    expect(getScheduledProgramForDate(defaultSchedule(), new Date('2026-09-30T02:00:00Z'))).toBe('daily-10')
  })
  it('returns no program for an unscheduled day', () => expect(getScheduledProgramForDate(defaultSchedule(), new Date(2026, 8, 28))).toBeNull())
  it('requires the exact scheduled program finished on the exact local day', () => {
    const quick = record('quick-5'); const daily = record('daily-10')
    expect(isScheduledProgramCompleted([quick], 'daily-10', tuesday())).toBe(false)
    expect(isScheduledProgramCompleted([quick, daily], 'daily-10', tuesday())).toBe(true)
    expect(isScheduledProgramCompleted([daily], 'daily-10', new Date(2026, 8, 30))).toBe(false)
    expect(isScheduledProgramCompleted([daily], null, tuesday())).toBe(false)
  })
  it('explicit partial finish counts as a scheduled occurrence, not as full stretch coverage', () => {
    const entry = historicalSession(sessionReducer(createProgramSession('daily-10', normal, tuesday().getTime()), { type: 'FINISH_EARLY', now: tuesday().getTime() + 10000 }))!
    expect(isScheduledProgramCompleted([entry], 'daily-10', tuesday())).toBe(true); expect(todayCoveredRegions([entry], tuesday()).size).toBe(0)
  })
  it('counts this week once per scheduled day despite repeated same-program sessions', () => {
    const history = [record('daily-10', tuesday()), record('daily-10', tuesday()), record('daily-10', new Date(2026, 9, 1, 9))]
    expect(weeklyCompletedCount(defaultSchedule(), history, tuesday())).toEqual({ completed: 2, scheduled: 3 })
    expect(getWeeklySchedule(defaultSchedule(), history, tuesday())[1]).toMatchObject({ today: true, completed: true, programId: 'daily-10' })
  })
  it('starts each local week on Monday across month/year and DST boundaries', () => {
    const week = getWeeklySchedule(defaultSchedule(), [], new Date(2027, 0, 1, 9))
    expect(week[0].date.getDate()).toBe(28); expect(week[6].date.getDate()).toBe(3)
    const dst = getWeeklySchedule(defaultSchedule(), [], new Date(2026, 10, 1, 9))
    expect(dst.map(day => day.date.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0])
  })
  it('schedule edits do not retroactively satisfy a different current-day assignment', () => {
    const schedule = defaultSchedule(); const quick = record('quick-5')
    expect(getWeeklySchedule(schedule, [quick], tuesday())[1].completed).toBe(false)
    schedule[1].programId = 'quick-5'; expect(getWeeklySchedule(schedule, [quick], tuesday())[1].completed).toBe(true)
  })
})
describe('active program compatibility', () => {
  it.each(programIds)('restores %s with its program ID, captured holds and exact deadline', programId => {
    const port = storage(); const initial = sessionReducer(createProgramSession(programId, normal, tuesday().getTime()), { type: 'START', now: tuesday().getTime() })
    activeSessionRepository(port).save(initial)
    const restored = restoreSession(activeSessionRepository(port).load().value!, tuesday().getTime() + 11000)
    expect(restored.programId).toBe(programId); expect(restored.ids).toEqual(initial.ids); expect(restored.holds).toEqual(initial.holds); expect(restored.remaining).toBe(19000)
    expect(validActiveSession(restored)).toBe(true)
  })
  it('normalizes legacy active full-body state without losing timer position or rewriting storage', () => {
    const current = sessionReducer(createProgramSession('full-20', normal, tuesday().getTime()), { type: 'START', now: tuesday().getTime() })
    const { holds: _, programId: __, ...base } = current; const legacy = { ...base, kind: 'full-body' }
    const port = storage(); const raw = JSON.stringify({ schemaVersion: 1, data: legacy }); port.setItem(storageKeys.active, raw)
    const next = activeSessionRepository(port).load().value!
    expect(next.programId).toBe('full-20'); expect(next.deadline).toBe(current.deadline); expect(next.results).toEqual(current.results); expect(next.holds).toEqual(current.holds); expect(port.getItem(storageKeys.active)).toBe(raw)
  })
  it('normalizes legacy targeted sessions independently', () => {
    const current = createSession(['supine-hamstring-stretch'], 'targeted'); const { holds: _, programId: __, ...legacy } = current
    expect(normalizeActiveSession(legacy)).toEqual(current)
  })
  it('changing preferences or schedule cannot mutate an existing active program', () => {
    const profile = defaultProfile(); const state = createProgramSession('daily-10', profile.profile.preferences)
    const captured = structuredClone(state); profile.profile.preferences.holdSeconds = 20; profile.profile.weeklySchedule[1].programId = 'quick-5'
    expect(state).toEqual(captured)
  })
  it('rejects malformed program IDs, list order and captured hold sequences', () => {
    const state = createProgramSession('quick-5', normal)
    expect(validActiveSession({ ...state, programId: 'unknown' })).toBe(false)
    expect(validActiveSession({ ...state, ids: [...state.ids].reverse() })).toBe(false)
    const corrupt = structuredClone(state); corrupt.holds[state.ids[0]][0].side = 'right'; expect(validActiveSession(corrupt)).toBe(false)
  })
  it('rejects new program history with a mismatched program prescription list', () => {
    const entry = record('quick-5'); expect(validHistoryEntry({ ...entry, programId: 'full-20' })).toBe(false)
  })
})
