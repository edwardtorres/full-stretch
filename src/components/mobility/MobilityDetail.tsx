import { ArrowRight } from 'lucide-react'
import { getMobilityMovement, getMobilityRoutine } from '../../data/mobility'
import { mobilityPrescriptionText } from '../../lib/mobility'
import type { MobilityRoutineId } from '../../types/mobility'
import { PageHeading } from '../PageHeading'

export function MobilityDetail({ routineId, onBack, onStart }: { routineId: MobilityRoutineId; onBack: () => void; onStart: (id: MobilityRoutineId) => void }) {
  const routine = getMobilityRoutine(routineId)
  return <main id="main" className="secondary-page mobility-detail"><PageHeading eyebrow="Dynamic warm-up" title={routine.name} onBack={onBack} backLabel="Back to Mobility" />
    <p className="page-intro">{routine.description}</p><p className="mobility-detail-meta">{routine.steps.length} movements <span aria-hidden="true">·</span> {routine.expectedMinutes}</p>
    <button className="primary-button program-start" onClick={() => onStart(routine.id)}>Start warm-up <ArrowRight size={18} /></button>
    <h2 className="section-title">Movements</h2><ol className="program-sequence mobility-sequence">{routine.steps.map((step, index) => {
      const movement = getMobilityMovement(step.movementId)
      return <li key={step.movementId}><span className="mini-label">{String(index + 1).padStart(2, '0')}</span><div><strong>{movement.name}</strong><small>{mobilityPrescriptionText(step.prescription ?? movement.prescription)}</small></div></li>
    })}</ol><p className="program-tier-note">Repetitions are confirmed by you. Time estimates include your own transitions.</p>
  </main>
}
