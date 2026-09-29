import { ArrowRight, Check } from 'lucide-react'
import type { WeeklySchedule } from '../../types/schedule'
import type { StretchPreferences } from '../../types/profile'
import type { StretchHistoryEntry } from '../../types/history'
import type { SessionState } from '../../lib/session'
import type { ProgramId } from '../../types/program'
import { getProgram, getProgramPlannedHoldTime } from '../../lib/programs'
import { getLocalWeekday, getScheduledProgramForDate, isScheduledProgramCompleted, weekdayLabels } from '../../lib/schedule'
import { sameLocalDay } from '../../lib/dates'
import { clockText } from '../../lib/stretch'
export function TodayProgram({ schedule, preferences, history, active, today, onPrograms, onStart }: { schedule: WeeklySchedule; preferences: StretchPreferences; history: StretchHistoryEntry[]; active: SessionState | null; today: Date; onPrograms: () => void; onStart: (id: ProgramId) => void }) {
  const id = getScheduledProgramForDate(schedule, today)
  const program = id ? getProgram(id) : null
  const finished = isScheduledProgramCompleted(history, id, today)
  const fullyComplete = finished && history.some(entry => entry.programId === id && sameLocalDay(entry.completedAt, today) && entry.stretches.every(stretch => stretch.status === 'completed'))
  const inProgress = !!id && active?.phase !== 'complete' && active?.programId === id
  return <section className="full-body-cta today-program" aria-label="Today's program"><div className="routine-line"><span className="eyebrow">Today · {weekdayLabels[getLocalWeekday(today)]}</span>{finished && <span className="today-program-status"><Check size={13} aria-hidden="true" />{fullyComplete ? 'Complete' : 'Finished with skips'}</span>}</div><h3>{program?.name ?? 'No program scheduled'}</h3><p>{program ? `${program.stretchIds.length} stretches · ${clockText(getProgramPlannedHoldTime(id!, preferences))} planned hold time` : 'Choose a program or target a muscle.'}</p>{inProgress ? <p className="today-program-status">In progress · continue above</p> : program ? <button className="outline-button" onClick={() => onStart(id!)}>{finished ? 'Start again' : "Start today’s program"}<ArrowRight size={17} /></button> : <button className="outline-button" onClick={onPrograms}>Start a program<ArrowRight size={17} /></button>}<button className="text-button" onClick={onPrograms}>All programs<ArrowRight size={14} /></button></section>
}
