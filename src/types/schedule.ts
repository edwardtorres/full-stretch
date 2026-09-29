import type { ProgramId } from './program'
export const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type Weekday = typeof weekdays[number]
export interface StretchScheduleEntry { weekday: Weekday; programId: ProgramId | null }
export type WeeklySchedule = StretchScheduleEntry[]
