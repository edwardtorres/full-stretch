import { weekdays } from '../types/schedule'
import type { Weekday, WeeklySchedule } from '../types/schedule'
import type { ProgramId } from '../types/program'
import type { StretchHistoryEntry } from '../types/history'
import { isProgramId } from './programs'
import { sameLocalDay, localDayKey } from './dates'
const weekdayByDate: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
export const weekdayLabels: Record<Weekday, string> = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }
export const getLocalWeekday = (date: Date) => weekdayByDate[date.getDay()]
export const defaultSchedule = (): WeeklySchedule => weekdays.map(weekday => ({ weekday, programId: weekday === 'tuesday' || weekday === 'thursday' ? 'daily-10' : weekday === 'saturday' ? 'full-20' : null }))
export function normalizeSchedule(value: unknown): WeeklySchedule {
  if (value === undefined) return defaultSchedule()
  return weekdays.map(weekday => {
    const entry = Array.isArray(value) ? value.find(item => item && typeof item === 'object' && item.weekday === weekday) : null
    return { weekday, programId: isProgramId(entry?.programId) ? entry.programId : null }
  })
}
export function validSchedule(value: unknown): value is WeeklySchedule {
  return Array.isArray(value) && value.length === 7 && new Set(value.map(item => item?.weekday)).size === 7 && value.every(item => item && weekdays.includes(item.weekday) && (item.programId === null || isProgramId(item.programId)))
}
export const getScheduledProgramForDate = (schedule: WeeklySchedule, date = new Date()) => schedule.find(entry => entry.weekday === getLocalWeekday(date))?.programId ?? null
// Explicit finish satisfies a scheduled occurrence, even if some holds were skipped.
// Successful stretch/region coverage remains a separate calculation.
export const isScheduledProgramCompleted = (history: StretchHistoryEntry[], programId: ProgramId | null, date = new Date()) => programId !== null && history.some(entry => entry.sessionType === 'program' && entry.programId === programId && sameLocalDay(entry.completedAt, date))
export function getWeeklySchedule(schedule: WeeklySchedule, history: StretchHistoryEntry[], today = new Date()) {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7)
  return weekdays.map((weekday, index) => {
    const date = new Date(monday); date.setDate(monday.getDate() + index)
    const programId = getScheduledProgramForDate(schedule, date)
    return { weekday, date, programId, today: localDayKey(date) === localDayKey(today), completed: isScheduledProgramCompleted(history, programId, date) }
  })
}
export const weeklyCompletedCount = (schedule: WeeklySchedule, history: StretchHistoryEntry[], today = new Date()) => {
  const week = getWeeklySchedule(schedule, history, today)
  return { completed: week.filter(day => day.completed).length, scheduled: week.filter(day => day.programId !== null).length }
}
