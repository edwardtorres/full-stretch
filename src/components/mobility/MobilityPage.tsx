import { ArrowRight } from 'lucide-react'
import { mobilityRoutines } from '../../data/mobility'
import type { MobilityRoutineId } from '../../types/mobility'
import { PageHeading } from '../PageHeading'

export function MobilityPage({ onBack, onSelect }: { onBack: () => void; onSelect: (id: MobilityRoutineId) => void }) {
  return <main id="main" className="secondary-page mobility-page"><PageHeading eyebrow="Mobility" title="Ready to move." onBack={onBack} />
    <p className="page-intro">Dynamic movement to prepare for activity. Move through comfortable ranges; finish ready, not tired.</p>
    <div className="mobility-note"><strong>Mobility</strong><span>These warm-ups use movement and manual repetitions. Flexibility programs use static holds and have their own weekly schedule.</span></div>
    <div className="program-list">{mobilityRoutines.map((routine, index) => <button className="program-row mobility-row" key={routine.id} onClick={() => onSelect(routine.id)}><span className="program-number" aria-hidden="true">0{index + 1}</span><span className="program-row-main"><strong>{routine.name}</strong><span>{routine.description}</span><small>{routine.steps.length} movements · {routine.expectedMinutes}</small></span><ArrowRight size={20} aria-hidden="true" /></button>)}</div>
    <p className="program-tier-note">Pace varies. Stop if you experience sharp or unusual pain.</p>
  </main>
}
