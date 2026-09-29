import { ArrowRight } from 'lucide-react'
import { programs } from '../../data/programs'
import type { ProgramId } from '../../types/program'
import type { StretchPreferences } from '../../types/profile'
import type { WeeklySchedule } from '../../types/schedule'
import type { StretchHistoryEntry } from '../../types/history'
import { getProgramHoldCount, getProgramPlannedHoldTime } from '../../lib/programs'
import { clockText } from '../../lib/stretch'
import { PageHeading } from '../PageHeading'
import { WeeklyView } from './WeeklyView'
export function ProgramsPage({ preferences, schedule, history, today, onSelect, onBack, onSettings }: { preferences: StretchPreferences; schedule: WeeklySchedule; history: StretchHistoryEntry[]; today: Date; onSelect: (id: ProgramId) => void; onBack: () => void; onSettings: () => void }) {
  return <main id="main" className="secondary-page programs-page"><PageHeading title="A little or a little longer." eyebrow="Programs" onBack={onBack} /><p className="page-intro">Choose a program. Times below use your {preferences.holdSeconds}-second holds and {preferences.sets} {preferences.sets === 1 ? 'set' : 'sets'}; transitions add time.</p><div className="program-list">{programs.map((program, index) => <button className="program-row" key={program.id} onClick={() => onSelect(program.id)}><span className="program-number" aria-hidden="true">0{index + 1}</span><span className="program-row-main"><strong>{program.name}</strong><span>{program.purpose}</span><small>{program.stretchIds.length} stretches · {getProgramHoldCount(program.id, preferences)} holds</small></span><span className="program-row-time"><b>{clockText(getProgramPlannedHoldTime(program.id, preferences))}</b><small>Planned hold time</small></span><ArrowRight size={20} aria-hidden="true" /></button>)}</div><p className="program-tier-note">Program names describe the tier. Actual session time varies with transitions.</p><WeeklyView schedule={schedule} history={history} today={today} onSettings={onSettings} /></main>
}
