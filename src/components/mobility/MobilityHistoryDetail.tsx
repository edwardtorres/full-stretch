import { getMobilityMovement } from '../../data/mobility'
import { mobilityHistoryName } from '../../lib/mobilityHistory'
import { mobilityPrescriptionText } from '../../lib/mobility'
import { clockText } from '../../lib/stretch'
import { displayDateTime } from '../../lib/dates'
import type { MobilityHistoryEntry } from '../../types/history'
import { PageHeading } from '../PageHeading'
export function MobilityHistoryDetail({ entry, onBack }: { entry: MobilityHistoryEntry; onBack: () => void }) {
  const completed = entry.movements.filter(item => item.status === 'completed').length
  return <main id="main" className="secondary-page history-detail"><PageHeading title={`${mobilityHistoryName(entry)}.`} eyebrow="Mobility history" onBack={onBack} backLabel="Back to Progress" /><p className="page-intro">{displayDateTime(entry.completedAt)}</p><div className="progress-totals"><div><b>{completed} / {entry.movements.length}</b><span>Movements completed</span></div><div><b>{entry.movements.length - completed}</b><span>Skipped</span></div><div><b>{clockText(entry.durationSeconds)}</b><span>Session duration</span></div></div>
    <p className="muted detail-timestamps">Started {displayDateTime(entry.startedAt)} · Finished {displayDateTime(entry.completedAt)}</p><div className="mobility-history-movements">{entry.movements.map(item => <div key={item.movementId}><strong>{getMobilityMovement(item.movementId).name}</strong><span>{mobilityPrescriptionText(item.prescription)} · {item.status === 'completed' ? 'Completed' : 'Skipped'}</span>{item.prescription.kind === 'seconds' && <small>Actual timed movement: {clockText(Math.floor((item.actualTimedMs ?? 0) / 1000))}</small>}</div>)}</div>
  </main>
}
