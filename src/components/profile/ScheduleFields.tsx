import type { WeeklySchedule, Weekday } from '../../types/schedule'
import { programs } from '../../data/programs'
import { weekdayLabels } from '../../lib/schedule'
import type { ProgramId } from '../../types/program'
export function ScheduleFields({ value, onChange }: { value: WeeklySchedule; onChange: (next: WeeklySchedule) => void }) {
  const update = (weekday: Weekday, programId: ProgramId | null) => onChange(value.map(entry => entry.weekday === weekday ? { ...entry, programId } : entry))
  return <div className="schedule-fields">{value.map(entry => <label key={entry.weekday}><span>{weekdayLabels[entry.weekday]}</span><select aria-label={`${weekdayLabels[entry.weekday]} program`} value={entry.programId ?? ''} onChange={event => update(entry.weekday, (event.target.value || null) as ProgramId | null)}><option value="">No program</option>{programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>)}</div>
}
