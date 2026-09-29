import { Check } from 'lucide-react'
import type { WeeklySchedule } from '../../types/schedule'
import type { StretchHistoryEntry } from '../../types/history'
import { getProgram } from '../../lib/programs'
import { getWeeklySchedule, weeklyCompletedCount, weekdayLabels } from '../../lib/schedule'
export function WeeklyView({ schedule, history, today, onSettings }: { schedule: WeeklySchedule; history: StretchHistoryEntry[]; today: Date; onSettings: () => void }) {
  const week = getWeeklySchedule(schedule, history, today)
  const count = weeklyCompletedCount(schedule, history, today)
  return <section className="weekly-view" aria-labelledby="week-heading"><div className="weekly-heading"><h2 id="week-heading">This week</h2><button className="text-button" onClick={onSettings}>Edit schedule</button></div><p className="muted">{count.completed} / {count.scheduled} scheduled sessions finished</p><ol className="weekly-days">{week.map(day => <li key={day.weekday} className={day.today ? 'is-today' : ''} aria-current={day.today ? 'date' : undefined}><span className="week-day-name">{weekdayLabels[day.weekday]}<small>{day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{day.today ? ' · Today' : ''}</small></span><strong>{day.programId ? getProgram(day.programId).name : 'No program'}</strong><span className="week-status">{day.completed ? <><Check size={14} aria-hidden="true" />Finished</> : <span className="sr-only">{day.programId ? 'Not finished' : 'Unscheduled'}</span>}</span></li>)}</ol></section>
}
