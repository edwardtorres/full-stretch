import type { WeeklySchedule } from '../types/schedule'
import { validSchedule } from './schedule'
import { localDayKey } from './dates'

export interface WeekSnapshot { weekStart: string; schedule: WeeklySchedule }

export function mondayOf(value: Date): Date {
  const day = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12)
  day.setDate(day.getDate() - (day.getDay() + 6) % 7)
  return day
}

export const weekKey = (value: Date) => localDayKey(mondayOf(value))
export function dateFromLocalKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}
export function shiftLocalDays(value: Date, days: number): Date {
  const next = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12)
  next.setDate(next.getDate() + days)
  return next
}
export function validWeekSnapshots(value: unknown): value is WeekSnapshot[] {
  return Array.isArray(value) && value.length <= 1000 && new Set(value.map(item => item?.weekStart)).size === value.length && value.every(item => {
    if (!item || typeof item !== 'object' || typeof item.weekStart !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.weekStart) || !validSchedule(item.schedule)) return false
    const date = dateFromLocalKey(item.weekStart)
    return Number.isFinite(date.getTime()) && localDayKey(date) === item.weekStart && date.getDay() === 1
  })
}
export function recordWeekSchedule(snapshots: WeekSnapshot[], schedule: WeeklySchedule, now = new Date()): WeekSnapshot[] {
  const key = weekKey(now)
  const existing = snapshots.find(item => item.weekStart === key)
  if (existing && JSON.stringify(existing.schedule) === JSON.stringify(schedule)) return snapshots
  return [...snapshots.filter(item => item.weekStart !== key), { weekStart: key, schedule: structuredClone(schedule) }].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}
