import type { HistoryEntry, MobilityHistoryEntry, StretchHistoryEntry } from '../types/history'
import type { BaselineAssessment } from '../types/profile'
import type { WeekSnapshot } from './weekSnapshots'
import { deriveMilestones, getWeekStreaks } from './analytics'
import { isFlexibilityHistory, isMobilityHistory } from './mobilityHistory'

// Presentation of existing rules; no separate milestone state is persisted.
export function milestoneProgress(id: string, flexibility: StretchHistoryEntry[], mobility: MobilityHistoryEntry[], bestStreak: number): string | null {
  const flex = new Set(flexibility.map(entry => entry.id)).size
  const mobs = new Set(mobility.map(entry => entry.id)).size
  const counts: Record<string, [number, number]> = {
    'first-stretch': [flex, 1], 'ten-flexibility': [flex, 10],
    'twenty-five-flexibility': [flex, 25], 'fifty-flexibility': [flex, 50],
    'first-mobility': [mobs, 1], 'ten-mobility': [mobs, 10],
    'three-week-streak': [bestStreak, 3], 'five-week-streak': [bestStreak, 5],
  }
  const count = counts[id]
  return count ? `${Math.min(count[0], count[1])} / ${count[1]}` : null
}
export function sessionEarnedEvents(history: HistoryEntry[], sessionId: string, baseline: BaselineAssessment[], weeks: WeekSnapshot[], now: Date): string[] {
  if (!history.some(entry => entry.id === sessionId)) return []
  const flexibility = history.filter(isFlexibilityHistory)
  const mobility = history.filter(isMobilityHistory)
  const beforeFlex = flexibility.filter(entry => entry.id !== sessionId)
  const beforeMob = mobility.filter(entry => entry.id !== sessionId)
  const before = deriveMilestones(beforeFlex, beforeMob, baseline, weeks, now)
  const after = deriveMilestones(flexibility, mobility, baseline, weeks, now)
  const events = after.filter(item => item.earned && !before.find(old => old.id === item.id)?.earned).map(item => `Milestone earned · ${item.name}`)
  const priorWeeks = getWeekStreaks(weeks, beforeFlex, now).completeWeeks
  if (getWeekStreaks(weeks, flexibility, now).completeWeeks.some(week => !priorWeeks.some(prior => prior.weekStart === week.weekStart))) events.unshift('Complete Week · all scheduled flexibility sessions finished')
  return events
}
