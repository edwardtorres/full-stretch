import type { BaselineAssessment } from '../types/profile'
import type { MobilityHistoryEntry, StretchHistoryEntry } from '../types/history'
import type { WeeklySchedule } from '../types/schedule'
import type { RegionId } from '../types/stretch'
import { regionIds } from '../types/stretch'
import { calfProgramIds } from './coverage'
import { localDayKey } from './dates'
import { baselineAreas, baselineForRegion } from './profile'
import { getScheduledProgramForDate } from './schedule'
import { dateFromLocalKey, mondayOf, shiftLocalDays, weekKey } from './weekSnapshots'
import type { WeekSnapshot } from './weekSnapshots'
import { getMobilityMovement } from '../data/mobility'

const uniqueById = <T extends { id: string }>(entries: T[]): T[] => [...new Map(entries.map(entry => [entry.id, entry])).values()]
const dayDistance = (from: Date, to: Date) => Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000)
export function getWeekBounds(now = new Date()) { const start = mondayOf(now); return { start, end: shiftLocalDays(start, 6), key: localDayKey(start) } }
export type FlexWeekStatus = { weekStart: string; scheduled: number; finished: number; complete: boolean; completionAt: string | null }
export function getFlexibilityWeekStatus(schedule: WeeklySchedule, history: StretchHistoryEntry[], weekStart: Date): FlexWeekStatus {
  const start = mondayOf(weekStart)
  const entries = uniqueById(history)
  let scheduled = 0
  let finished = 0
  const finishes: string[] = []
  for (let offset = 0; offset < 7; offset++) {
    const day = shiftLocalDays(start, offset)
    const program = getScheduledProgramForDate(schedule, day)
    if (!program) continue
    scheduled++
    const match = entries.filter(entry => entry.sessionType === 'program' && entry.programId === program && localDayKey(entry.completedAt) === localDayKey(day)).sort((a, b) => a.completedAt.localeCompare(b.completedAt))[0]
    if (match) { finished++; finishes.push(match.completedAt) }
  }
  return { weekStart: localDayKey(start), scheduled, finished, complete: scheduled > 0 && finished === scheduled, completionAt: scheduled > 0 && finished === scheduled ? finishes.sort().at(-1)! : null }
}
export function flexibilityThisWeek(history: StretchHistoryEntry[], schedule: WeeklySchedule, now = new Date()) {
  const key = weekKey(now)
  const entries = uniqueById(history).filter(entry => weekKey(new Date(entry.completedAt)) === key)
  const completedStretches = entries.flatMap(entry => entry.stretches.filter(stretch => stretch.status === 'completed'))
  const holds = completedStretches.flatMap(stretch => stretch.holds.filter(hold => hold.status === 'completed'))
  return { sessions: entries.length, scheduled: getFlexibilityWeekStatus(schedule, entries, now), regions: new Set(completedStretches.flatMap(stretch => stretch.regionIds)).size, holds: holds.length, holdSeconds: Math.floor(holds.reduce((sum, hold) => sum + hold.actualMilliseconds, 0) / 1000) }
}
export function getWeekStreaks(snapshots: WeekSnapshot[], history: StretchHistoryEntry[], now = new Date()) {
  const current = weekKey(now)
  const statuses = new Map(snapshots.filter(item => item.weekStart <= current).map(item => [item.weekStart, getFlexibilityWeekStatus(item.schedule, history, dateFromLocalKey(item.weekStart))]))
  const complete = [...statuses.values()].filter(item => item.complete).sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  let best = 0; let run = 0; let previous: string | null = null
  for (const status of complete) {
    run = previous && weekKey(shiftLocalDays(dateFromLocalKey(previous), 7)) === status.weekStart ? run + 1 : 1
    best = Math.max(best, run); previous = status.weekStart
  }
  let cursor = statuses.get(current)?.complete ? current : weekKey(shiftLocalDays(dateFromLocalKey(current), -7))
  let active = 0
  while (statuses.get(cursor)?.complete) { active++; cursor = weekKey(shiftLocalDays(dateFromLocalKey(cursor), -7)) }
  return { current: active, best, completeWeeks: complete, historicalWeeksKnown: statuses.size }
}
export function getMobilityConsistency(history: MobilityHistoryEntry[], now = new Date()) {
  const all = uniqueById(history)
  const recent = all.filter(entry => weekKey(new Date(entry.completedAt)) === weekKey(now))
  const counts = new Map<string, number>()
  for (const entry of all) counts.set(entry.routineId, (counts.get(entry.routineId) ?? 0) + 1)
  return { thisWeek: recent.length, weekMovements: recent.flatMap(entry => entry.movements).filter(item => item.status === 'completed').length, weekSeconds: recent.reduce((sum, entry) => sum + entry.durationSeconds, 0), total: all.length, movements: all.flatMap(entry => entry.movements).filter(item => item.status === 'completed').length, seconds: all.reduce((sum, entry) => sum + entry.durationSeconds, 0), routineCounts: counts }
}
export function getMobilityRegionUse(history: MobilityHistoryEntry[]) {
  return regionIds.map(region => ({ region, warmups: uniqueById(history).filter(entry => entry.movements.some(item => item.status === 'completed' && getMobilityMovement(item.movementId).primaryRegions.includes(region))).length })).filter(item => item.warmups > 0).sort((a, b) => b.warmups - a.warmups || regionIds.indexOf(a.region) - regionIds.indexOf(b.region))
}
export type CoverageWindow = 'recent' | 'all'
export type CoverageLabel = 'Well Covered' | 'Less Covered' | 'Building Data'
export interface RegionCoverageMetric { region: RegionId; sessions: number; completedHolds: number; holdSeconds: number; lastStretched: string | null; days: number; dayKeys: string[]; weeks: number }
export function getRegionCoverageMetrics(history: StretchHistoryEntry[], window: CoverageWindow, now = new Date()): RegionCoverageMetric[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  const entries = uniqueById(history).filter(entry => {
    const diff = dayDistance(new Date(entry.completedAt), today)
    return diff >= 0 && (window === 'all' || diff < 42)
  })
  return regionIds.map(region => {
    const matching = entries.map(entry => ({ entry, stretches: entry.stretches.filter(stretch => stretch.status === 'completed' && stretch.regionIds.includes(region)) })).filter(item => item.stretches.length)
    const holds = matching.flatMap(item => item.stretches.flatMap(stretch => stretch.holds.filter(hold => hold.status === 'completed')))
    const dayKeys = [...new Set(matching.map(item => localDayKey(item.entry.completedAt)))].sort()
    const latest = matching.map(item => item.entry.completedAt).sort().at(-1) ?? null
    return { region, sessions: matching.length, completedHolds: holds.length, holdSeconds: Math.floor(holds.reduce((sum, hold) => sum + hold.actualMilliseconds, 0) / 1000), lastStretched: latest, days: dayKeys.length, dayKeys, weeks: new Set(dayKeys.map(key => weekKey(dateFromLocalKey(key)))).size }
  })
}
export function classifyCoverage(metric: RegionCoverageMetric, all: RegionCoverageMetric[], flexDays: number, now = new Date()): CoverageLabel {
  const days = metric.dayKeys.map(dateFromLocalKey)
  const recentDays = days.filter(day => dayDistance(day, now) >= 0 && dayDistance(day, now) < 42)
  const sinceLast = days.length ? dayDistance(days.at(-1)!, now) : Infinity
  const largestGap = recentDays.slice(1).reduce((max, day, index) => Math.max(max, dayDistance(recentDays[index], day)), 0)
  const recentWeeks = new Set(recentDays.map(weekKey)).size
  if (recentDays.length >= 4 && recentWeeks >= 3 && sinceLast <= 21 && largestGap <= 21) return 'Well Covered'
  const maxDays = Math.max(...all.map(item => item.days))
  if (flexDays >= 4 && maxDays >= 4 && metric.days <= maxDays * .4 && sinceLast >= 14) return 'Less Covered'
  return 'Building Data'
}
export function getCoverageSummary(history: StretchHistoryEntry[], window: CoverageWindow, now = new Date()) {
  const metrics = getRegionCoverageMetrics(history, window, now)
  const flexDays = new Set(uniqueById(history).filter(entry => entry.stretches.some(stretch => stretch.status === 'completed') && (window === 'all' || (dayDistance(new Date(entry.completedAt), now) >= 0 && dayDistance(new Date(entry.completedAt), now) < 42))).map(entry => localDayKey(entry.completedAt))).size
  return metrics.map(metric => ({ ...metric, label: classifyCoverage(metric, metrics, flexDays, now) }))
}
export function getBaselineChanges(assessments: BaselineAssessment[]) {
  return baselineAreas.map(area => {
    const region = area.regionIds[0]
    const original = baselineForRegion(assessments, region, 'original')
    const latest = baselineForRegion(assessments, region, 'latest')
    return { id: area.id, label: area.label, original, latest, status: original && latest && assessments.length > 1 ? original.perception === latest.perception ? 'Unchanged' : 'Changed' : 'Needs more history' as 'Changed' | 'Unchanged' | 'Needs more history' }
  })
}
export interface Milestone { id: string; name: string; description: string; earned: boolean; earnedAt: string | null }
export function deriveMilestones(flexibility: StretchHistoryEntry[], mobility: MobilityHistoryEntry[], assessments: BaselineAssessment[], snapshots: WeekSnapshot[], now = new Date()): Milestone[] {
  const flex = uniqueById(flexibility).sort((a, b) => a.completedAt.localeCompare(b.completedAt))
  const mobs = uniqueById(mobility).sort((a, b) => a.completedAt.localeCompare(b.completedAt))
  const weeks = getWeekStreaks(snapshots, flex, now).completeWeeks
  const nth = <T extends { completedAt: string }>(items: T[], count: number) => items[count - 1]?.completedAt ?? null
  const program = flex.find(entry => entry.sessionType === 'program')?.completedAt ?? null
  let streak3: string | null = null; let streak5: string | null = null; let run = 0; let prior: string | null = null
  for (const week of weeks) { run = prior && weekKey(shiftLocalDays(dateFromLocalKey(prior), 7)) === week.weekStart ? run + 1 : 1; prior = week.weekStart; if (run === 3 && !streak3) streak3 = week.completionAt; if (run === 5 && !streak5) streak5 = week.completionAt }
  const completedIds = new Set<string>(); const covered = new Set<RegionId>(); let allRegionsAt: string | null = null
  for (const entry of flex) { for (const stretch of entry.stretches.filter(item => item.status === 'completed')) { completedIds.add(stretch.stretchId); stretch.regionIds.forEach(id => covered.add(id)) } if (!allRegionsAt && regionIds.every(id => covered.has(id)) && calfProgramIds.every(id => completedIds.has(id))) allRegionsAt = entry.completedAt }
  const retest = [...new Map(assessments.map(item => [item.id, item])).values()].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))[1]?.recordedAt ?? null
  const make = (id: string, name: string, description: string, earnedAt: string | null): Milestone => ({ id, name, description, earned: earnedAt !== null, earnedAt })
  return [
    make('first-stretch', 'First Stretch Session', 'Finish a flexibility session.', nth(flex, 1)),
    make('first-program', 'First Program', 'Finish a flexibility program.', program),
    make('first-complete-week', 'First Complete Week', 'Finish every scheduled flexibility program in a recorded week.', weeks[0]?.completionAt ?? null),
    make('three-week-streak', '3-Week Streak', 'Complete three consecutive recorded schedule weeks.', streak3),
    make('five-week-streak', '5-Week Streak', 'Complete five consecutive recorded schedule weeks.', streak5),
    make('ten-flexibility', '10 Flexibility Sessions', 'Finish ten flexibility sessions.', nth(flex, 10)),
    make('twenty-five-flexibility', '25 Flexibility Sessions', 'Finish twenty-five flexibility sessions.', nth(flex, 25)),
    make('fifty-flexibility', '50 Flexibility Sessions', 'Finish fifty flexibility sessions.', nth(flex, 50)),
    make('all-regions', 'All Regions Stretched', 'Complete a stretch for all 13 regions, including both calf variations.', allRegionsAt),
    make('baseline-retest', 'First Baseline Retest', 'Record a second self-assessment.', retest),
    make('first-mobility', 'First Mobility Session', 'Finish a mobility warm-up.', nth(mobs, 1)),
    make('ten-mobility', '10 Mobility Sessions', 'Finish ten mobility warm-ups.', nth(mobs, 10)),
  ]
}
