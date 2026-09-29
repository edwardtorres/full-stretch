import { describe, expect, it } from 'vitest'
import type { StretchHistoryEntry, MobilityHistoryEntry } from '../types/history'
import type { WeeklySchedule } from '../types/schedule'
import type { ProgramId } from '../types/program'
import type { RegionId } from '../types/stretch'
import type { BaselineAssessment } from '../types/profile'
import { regionIds } from '../types/stretch'
import { getStretch, stretchesForRegion } from './stretch'
import { defaultSchedule } from './schedule'
import { getWeekBounds, getFlexibilityWeekStatus, flexibilityThisWeek, getWeekStreaks, getMobilityConsistency, getMobilityRegionUse, getRegionCoverageMetrics, classifyCoverage, getCoverageSummary, getBaselineChanges, deriveMilestones } from './analytics'
import { dateFromLocalKey, mondayOf, recordWeekSchedule, shiftLocalDays, validWeekSnapshots, weekKey } from './weekSnapshots'
import { resetAllData, storageKeys, weekSnapshotRepository } from './storage'
import { defaultProfile } from './profile'

const at = (day: string, hour = 12) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, hour) }
const iso = (day: string, hour = 12) => at(day, hour).toISOString()
const now = at('2026-09-29')
const schedule = defaultSchedule()
const emptySchedule: WeeklySchedule = schedule.map(item => ({ ...item, programId: null }))
const oneTuesday: WeeklySchedule = schedule.map(item => ({ ...item, programId: item.weekday === 'tuesday' ? 'daily-10' : null }))
const stretch = (id: string, status: 'completed' | 'partial' = 'completed') => ({ stretchId: id, regionIds: [...getStretch(id).primaryRegions], prescribedHoldSeconds: 30, prescribedSets: 1, status, holds: [{ setNumber: 1, side: null as null, prescribedSeconds: 30, actualMilliseconds: status === 'completed' ? 30000 : 10000, status: status === 'completed' ? 'completed' as const : 'skipped' as const }] })
let sequence = 0
const flex = (day: string, programId: ProgramId | null = null, stretches = [stretch('supine-hamstring-stretch')], id = `f-${++sequence}`): StretchHistoryEntry => ({ activityType: 'flexibility', id, sessionType: programId ? 'program' : 'targeted', programId, startedAt: iso(day, 10), completedAt: iso(day), durationSeconds: 120, stretches })
const mobility = (day: string, id = `m-${++sequence}`): MobilityHistoryEntry => ({ activityType: 'mobility', id, routineId: 'upper-body-warmup', startedAt: iso(day, 11), completedAt: iso(day), durationSeconds: 90, movements: [{ movementId: 'march-in-place', prescription: { kind: 'seconds', seconds: 30 }, status: 'completed', actualTimedMs: 30000 }, { movementId: 'arm-circles', prescription: { kind: 'reps', reps: 20, perSide: false }, status: 'skipped', actualTimedMs: null }] })
const snapshots = (keys: string[], plan = oneTuesday) => keys.map(key => ({ weekStart: key, schedule: plan }))
const planDays = (start: string, plan = schedule) => plan.flatMap((item, index) => item.programId ? [flex(weekDay(start, index), item.programId)] : [])
const weekDay = (start: string, offset: number) => { const d = shiftLocalDays(dateFromLocalKey(start), offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const assessment = (day: string, perception: 'very-tight' | 'moderately-tight'): BaselineAssessment => ({ id: `baseline-${day}`, recordedAt: iso(day), results: [{ regionId: 'hamstrings', perception, recordedAt: iso(day) }] })
const byRegion = (items: ReturnType<typeof getCoverageSummary>, region: RegionId) => items.find(item => item.region === region)!
const memory = () => { const map = new Map<string, string>(); return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v) }, removeItem: (k: string) => { map.delete(k) } } }

describe('calendar weeks and schedule snapshots', () => {
  it('starts weeks on local Monday and ends Sunday', () => { const b = getWeekBounds(at('2026-09-29')); expect(b.key).toBe('2026-09-28'); expect(b.end.getDay()).toBe(0) })
  it('handles Sunday as the previous Monday week', () => expect(weekKey(at('2026-10-04'))).toBe('2026-09-28'))
  it('crosses month boundaries by calendar date', () => expect(weekKey(at('2026-10-01'))).toBe('2026-09-28'))
  it('crosses a spring DST Sunday without fixed-millisecond week math', () => { expect(weekKey(at('2026-03-08'))).toBe('2026-03-02'); expect(weekKey(shiftLocalDays(at('2026-03-02'), 7))).toBe('2026-03-09') })
  it('crosses a fall DST Sunday without fixed-millisecond week math', () => { expect(weekKey(at('2026-11-01'))).toBe('2026-10-26'); expect(weekKey(shiftLocalDays(at('2026-10-26'), 7))).toBe('2026-11-02') })
  it('normalizes non-Monday input to its Monday', () => expect(mondayOf(at('2026-09-30')).getDate()).toBe(28))
  it('records the current recurring schedule by week', () => { const value = recordWeekSchedule([], schedule, now); expect(value).toEqual([{ weekStart: '2026-09-28', schedule }]) })
  it('does not duplicate an unchanged snapshot', () => { const value = recordWeekSchedule([], schedule, now); expect(recordWeekSchedule(value, schedule, now)).toBe(value) })
  it('edits only the current week snapshot', () => { const before = snapshots(['2026-09-21', '2026-09-28']); const changed = recordWeekSchedule(before, schedule, now); expect(changed[0].schedule).toEqual(oneTuesday); expect(changed[1].schedule).toEqual(schedule) })
  it('rejects duplicate or non-Monday snapshots', () => { expect(validWeekSnapshots(snapshots(['2026-09-28', '2026-09-28']))).toBe(false); expect(validWeekSnapshots(snapshots(['2026-09-29']))).toBe(false) })
  it('rejects impossible dates and malformed schedules', () => { expect(validWeekSnapshots(snapshots(['2026-02-30']))).toBe(false); expect(validWeekSnapshots([{ weekStart: '2026-09-28', schedule: [] }])).toBe(false) })
  it('writes schema 1 and loads it intact', () => { const port = memory(); const repo = weekSnapshotRepository(port); repo.save(snapshots(['2026-09-28'])); expect(JSON.parse(port.getItem(storageKeys.weeks)!).schemaVersion).toBe(1); expect(weekSnapshotRepository(port).load().value).toEqual(snapshots(['2026-09-28'])) })
  it('protects future week-snapshot schema', () => { const port = memory(); const raw = JSON.stringify({ schemaVersion: 2, data: [] }); port.setItem(storageKeys.weeks, raw); const repo = weekSnapshotRepository(port); expect(repo.load().issue).toBeTruthy(); expect(repo.save(snapshots(['2026-09-28'])).ok).toBe(false); expect(port.getItem(storageKeys.weeks)).toBe(raw) })
  it('reset removes the new snapshot key with existing keys', () => { const port = memory(); for (const key of Object.values(storageKeys)) port.setItem(key, '{}'); expect(resetAllData(port).ok).toBe(true); for (const key of Object.values(storageKeys)) expect(port.getItem(key)).toBeNull() })
  it('does not add a snapshot field to the old profile document', () => expect(defaultProfile().profile).not.toHaveProperty('weekSnapshots'))
})

describe('weekly flexibility and mobility isolation', () => {
  it('counts scheduled program completions on exact local days', () => { const history = planDays('2026-09-28'); expect(getFlexibilityWeekStatus(schedule, history, now)).toMatchObject({ scheduled: 3, finished: 3, complete: true }) })
  it('does not complete a week when one scheduled day is unfinished', () => expect(getFlexibilityWeekStatus(schedule, planDays('2026-09-28').slice(0, 2), now).complete).toBe(false))
  it('excludes zero-schedule weeks from Complete Week', () => expect(getFlexibilityWeekStatus(emptySchedule, [], now)).toMatchObject({ scheduled: 0, finished: 0, complete: false }))
  it('ignores an unscheduled program finished on another day', () => expect(getFlexibilityWeekStatus(oneTuesday, [flex('2026-09-30', 'daily-10')], now).finished).toBe(0))
  it('counts duplicate same-program same-day finishes once', () => expect(getFlexibilityWeekStatus(oneTuesday, [flex('2026-09-29', 'daily-10'), flex('2026-09-29', 'daily-10')], now).finished).toBe(1))
  it('keeps Phase 3 finish-with-skips schedule semantics', () => expect(getFlexibilityWeekStatus(oneTuesday, [flex('2026-09-29', 'daily-10', [stretch('supine-hamstring-stretch', 'partial')])], now).complete).toBe(true))
  it('does not let Mobility satisfy a flexibility schedule', () => expect(getFlexibilityWeekStatus(oneTuesday, [], now).finished + getMobilityConsistency([mobility('2026-09-29')], now).thisWeek).toBe(1))
  it('counts current perfect week in the active streak', () => expect(getWeekStreaks(snapshots(['2026-09-28']), planDays('2026-09-28', oneTuesday), now).current).toBe(1))
  it('preserves prior completed streak while current week is unfinished', () => expect(getWeekStreaks(snapshots(['2026-09-14', '2026-09-21', '2026-09-28']), [...planDays('2026-09-14', oneTuesday), ...planDays('2026-09-21', oneTuesday)], now).current).toBe(2))
  it('breaks a streak at a prior incomplete scheduled week', () => expect(getWeekStreaks(snapshots(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']), [...planDays('2026-09-07', oneTuesday), ...planDays('2026-09-21', oneTuesday)], now).current).toBe(1))
  it('does not bridge an unknown unsnapshotted historical week', () => expect(getWeekStreaks(snapshots(['2026-09-07', '2026-09-21']), [...planDays('2026-09-07', oneTuesday), ...planDays('2026-09-21', oneTuesday)], at('2026-09-21')).best).toBe(1))
  it('does not bridge a recorded zero-schedule week', () => { const snapshots0 = [...snapshots(['2026-09-07', '2026-09-21']), ...snapshots(['2026-09-14'], emptySchedule)]; expect(getWeekStreaks(snapshots0, [...planDays('2026-09-07', oneTuesday), ...planDays('2026-09-21', oneTuesday)], at('2026-09-21')).best).toBe(1) })
  it('finds the best streak even when current streak is shorter', () => { const keys = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']; const history = [...planDays(keys[0], oneTuesday), ...planDays(keys[1], oneTuesday), ...planDays(keys[2], oneTuesday)]; const result = getWeekStreaks(snapshots(keys), history, now); expect(result).toMatchObject({ current: 3, best: 3 }) })
  it('counts flexibility sessions and completed holds this week', () => { const result = flexibilityThisWeek([flex('2026-09-29', null, [stretch('supine-hamstring-stretch')]), flex('2026-09-22')], schedule, now); expect(result).toMatchObject({ sessions: 1, holds: 1, holdSeconds: 30, regions: 1 }) })
  it('excludes duplicate session IDs from weekly totals', () => { const entry = flex('2026-09-29'); expect(flexibilityThisWeek([entry, entry], schedule, now).sessions).toBe(1) })
  it('does not count skipped holds as completed holds', () => expect(flexibilityThisWeek([flex('2026-09-29', null, [stretch('supine-hamstring-stretch', 'partial')])], schedule, now).holds).toBe(0))
  it('counts mobility sessions, movements and time in its own week', () => expect(getMobilityConsistency([mobility('2026-09-29'), mobility('2026-09-22')], now)).toMatchObject({ thisWeek: 1, weekMovements: 1, weekSeconds: 90, total: 2, movements: 2, seconds: 180 }))
  it('counts each completed region once per mobility warm-up', () => expect(getMobilityRegionUse([mobility('2026-09-29')]).find(item => item.region === 'hip-flexors')?.warmups).toBe(1))
  it('does not use flexibility in mobility totals', () => expect(getMobilityConsistency([], now).total).toBe(0))
})

describe('completed static coverage and self-report', () => {
  const days = ['2026-09-02', '2026-09-09', '2026-09-16', '2026-09-23']
  const fourHamstrings = days.map(day => flex(day))
  it('counts distinct completed stretching days for a region', () => expect(byRegion(getCoverageSummary([...fourHamstrings, flex('2026-09-23')], 'recent', now), 'hamstrings').days).toBe(4))
  it('counts sessions separately from distinct days', () => expect(byRegion(getCoverageSummary([...fourHamstrings, flex('2026-09-23')], 'recent', now), 'hamstrings').sessions).toBe(5))
  it('totals completed static holds and time for a region', () => expect(byRegion(getCoverageSummary(fourHamstrings, 'recent', now), 'hamstrings')).toMatchObject({ completedHolds: 4, holdSeconds: 120 }))
  it('excludes partial stretches from region coverage', () => expect(byRegion(getCoverageSummary([flex('2026-09-29', null, [stretch('supine-hamstring-stretch', 'partial')])], 'recent', now), 'hamstrings').days).toBe(0))
  it('filters entries older than 42 local days from Recent', () => expect(byRegion(getCoverageSummary([flex('2026-08-17')], 'recent', now), 'hamstrings').days).toBe(0))
  it('includes the 42nd local day at the boundary', () => expect(byRegion(getCoverageSummary([flex('2026-08-19')], 'recent', now), 'hamstrings').days).toBe(1))
  it('includes old entries in All Time', () => expect(byRegion(getCoverageSummary([flex('2026-08-17')], 'all', now), 'hamstrings').days).toBe(1))
  it('labels adequately sampled recent Hamstrings Well Covered', () => expect(byRegion(getCoverageSummary(fourHamstrings, 'recent', now), 'hamstrings').label).toBe('Well Covered'))
  it('keeps recent Well Covered when All Time also has much older activity', () => expect(byRegion(getCoverageSummary([...fourHamstrings, flex('2025-01-01')], 'all', now), 'hamstrings').label).toBe('Well Covered'))
  it('labels no recent Biceps Less Covered after enough comparison days', () => expect(byRegion(getCoverageSummary(fourHamstrings, 'recent', now), 'biceps').label).toBe('Less Covered'))
  it('labels sparse new-user Biceps Building Data', () => expect(byRegion(getCoverageSummary([flex('2026-09-29')], 'recent', now), 'biceps').label).toBe('Building Data'))
  it('keeps one-off Chest as Building Data when too fresh to be Less Covered', () => expect(byRegion(getCoverageSummary([...fourHamstrings, flex('2026-09-29', null, [stretch(stretchesForRegion('chest')[0].id)])], 'recent', now), 'chest').label).toBe('Building Data'))
  it('does not label four days in one week Well Covered', () => { const entries = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'].map(day => flex(day)); expect(byRegion(getCoverageSummary(entries, 'recent', now), 'hamstrings').label).toBe('Building Data') })
  it('rejects Well Covered after a recent 22-day gap', () => { const entries = ['2026-08-19', '2026-08-20', '2026-08-21', '2026-09-22'].map(day => flex(day)); expect(byRegion(getCoverageSummary(entries, 'recent', now), 'hamstrings').label).not.toBe('Well Covered') })
  it('does not create a numeric flexibility score', () => expect(Object.keys(byRegion(getCoverageSummary(fourHamstrings, 'recent', now), 'hamstrings'))).not.toContain('score'))
  it('keeps Mobility records outside static coverage input', () => { const before = getCoverageSummary(fourHamstrings, 'recent', now); const afterMobility = getMobilityConsistency([mobility('2026-09-29')], now); expect(afterMobility.total).toBe(1); expect(getCoverageSummary(fourHamstrings, 'recent', now)).toEqual(before) })
  it('keeps original and latest baseline responses separate', () => { const values = getBaselineChanges([assessment('2026-07-01', 'very-tight'), assessment('2026-09-01', 'moderately-tight')]); expect(values.find(item => item.id === 'hamstrings')).toMatchObject({ original: { perception: 'very-tight' }, latest: { perception: 'moderately-tight' }, status: 'Changed' }) })
  it('labels identical baseline responses Unchanged', () => expect(getBaselineChanges([assessment('2026-07-01', 'very-tight'), assessment('2026-09-01', 'very-tight')]).find(item => item.id === 'hamstrings')?.status).toBe('Unchanged'))
  it('labels a single assessment Needs more history', () => expect(getBaselineChanges([assessment('2026-07-01', 'very-tight')]).find(item => item.id === 'hamstrings')?.status).toBe('Needs more history'))
  it('does not derive an objective baseline score', () => expect(getBaselineChanges([assessment('2026-07-01', 'very-tight')])[0]).not.toHaveProperty('score'))
  it('reports the last completed date, not a partial attempt', () => expect(byRegion(getCoverageSummary([flex('2026-09-20'), flex('2026-09-29', null, [stretch('supine-hamstring-stretch', 'partial')])], 'recent', now), 'hamstrings').lastStretched).toBe(iso('2026-09-20')))
  it('returns a metric for every selectable region', () => expect(getRegionCoverageMetrics([], 'recent', now)).toHaveLength(regionIds.length))
  it('uses Building Data for no evidence', () => { const metrics = getRegionCoverageMetrics([], 'recent', now); expect(classifyCoverage(metrics[0], metrics, 0, now)).toBe('Building Data') })
})

describe('reconstructable milestones', () => {
  const milestone = (id: string, flexibility: StretchHistoryEntry[] = [], mobilityHistory: MobilityHistoryEntry[] = [], baseline: BaselineAssessment[] = [], weekSnapshots = snapshots(['2026-09-28'])) => deriveMilestones(flexibility, mobilityHistory, baseline, weekSnapshots, now).find(item => item.id === id)!
  it('earns First Stretch Session from actual history time', () => expect(milestone('first-stretch', [flex('2026-09-29')])).toMatchObject({ earned: true, earnedAt: iso('2026-09-29') }))
  it('earns First Program only for a program session', () => { expect(milestone('first-program', [flex('2026-09-29')]).earned).toBe(false); expect(milestone('first-program', [flex('2026-09-29', 'daily-10')]).earned).toBe(true) })
  it('earns First Complete Week only with a recorded scheduled week', () => expect(milestone('first-complete-week', planDays('2026-09-28', oneTuesday)).earned).toBe(true))
  it('does not earn Complete Week for a zero-schedule snapshot', () => expect(milestone('first-complete-week', [], [], [], snapshots(['2026-09-28'], emptySchedule)).earned).toBe(false))
  it('earns 3-Week Streak at the third consecutive completed week', () => { const keys = ['2026-09-14', '2026-09-21', '2026-09-28']; expect(milestone('three-week-streak', keys.flatMap(key => planDays(key, oneTuesday)), [], [], snapshots(keys)).earned).toBe(true) })
  it('leaves 5-Week Streak locked after three weeks', () => { const keys = ['2026-09-14', '2026-09-21', '2026-09-28']; expect(milestone('five-week-streak', keys.flatMap(key => planDays(key, oneTuesday)), [], [], snapshots(keys)).earned).toBe(false) })
  it('earns 10 Flexibility Sessions at session ten', () => { const entries = Array.from({ length: 10 }, (_, index) => flex(weekDay('2026-09-14', index))); expect(milestone('ten-flexibility', entries).earnedAt).toBe(entries[9].completedAt) })
  it('does not double count duplicate history IDs', () => { const entry = flex('2026-09-29'); expect(milestone('ten-flexibility', Array(10).fill(entry)).earned).toBe(false) })
  it('earns First Mobility Session without a flexibility session', () => expect(milestone('first-mobility', [], [mobility('2026-09-29')]).earned).toBe(true))
  it('earns 10 Mobility Sessions at the tenth unique entry', () => { const entries = Array.from({ length: 10 }, (_, index) => mobility(weekDay('2026-09-14', index))); expect(milestone('ten-mobility', [], entries).earnedAt).toBe(entries[9].completedAt) })
  it('earns First Baseline Retest at the second assessment', () => expect(milestone('baseline-retest', [], [], [assessment('2026-07-01', 'very-tight'), assessment('2026-09-01', 'moderately-tight')]).earnedAt).toBe(iso('2026-09-01')))
  it('keeps baseline retest locked with one assessment', () => expect(milestone('baseline-retest', [], [], [assessment('2026-07-01', 'very-tight')]).earned).toBe(false))
  it('keeps All Regions Stretched locked when only one calf variation completed', () => { const ids = regionIds.map(region => stretchesForRegion(region)[0].id); const entries = ids.map((id, index) => flex(weekDay('2026-09-14', index), null, [stretch(id)])); expect(milestone('all-regions', entries).earned).toBe(false) })
  it('earns All Regions Stretched after both calf variations and all 13 regions', () => { const ids = [...new Set(regionIds.map(region => stretchesForRegion(region)[0].id)), 'straight-knee-wall-calf-stretch', 'bent-knee-wall-calf-stretch']; const entries = ids.map((id, index) => flex(weekDay('2026-09-14', index), null, [stretch(id)])); expect(milestone('all-regions', entries).earned).toBe(true) })
  it('does not let Mobility earn static All Regions Stretched', () => expect(milestone('all-regions', [], [mobility('2026-09-29')]).earned).toBe(false))
  it('returns twelve stable milestone identities', () => { const result = deriveMilestones([], [], [], [], now); expect(result).toHaveLength(12); expect(new Set(result.map(item => item.id)).size).toBe(12) })
  it('does not mutate history with milestone flags', () => { const entry = flex('2026-09-29'); const before = structuredClone(entry); deriveMilestones([entry], [], [], [], now); expect(entry).toEqual(before) })
})
