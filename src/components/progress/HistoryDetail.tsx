import { Check, SkipForward } from 'lucide-react'
import type { StretchHistoryEntry } from '../../types/history'
import { getStretch, clockText } from '../../lib/stretch'
import { historyTotals, historySessionName } from '../../lib/history'
import { displayDateTime } from '../../lib/dates'
import { regions } from '../../data/regions'
import { PageHeading } from '../PageHeading'
export function HistoryDetail({ entry, onBack }: { entry: StretchHistoryEntry; onBack: () => void }) {
  const totals = historyTotals([entry])
  return <main id="main" className="secondary-page history-detail"><PageHeading title={entry.sessionType === 'program' ? `${historySessionName(entry)}.` : 'Targeted stretch.'} eyebrow="Session history" onBack={onBack} backLabel="Back to Progress" /><p className="page-intro">{displayDateTime(entry.completedAt)}</p><div className="progress-totals"><div><b>{totals.stretches} / {totals.prescribedStretches}</b><span>Stretches complete</span></div><div><b>{clockText(totals.holdSeconds)}</b><span>Actual hold time</span></div><div><b>{clockText(entry.durationSeconds)}</b><span>Session duration</span></div></div>
    <p className="muted detail-timestamps">Started {displayDateTime(entry.startedAt)} · Finished {displayDateTime(entry.completedAt)}</p>
    <div className="historical-stretches">{entry.stretches.map(stretch => <details key={stretch.stretchId}><summary><span><strong>{getStretch(stretch.stretchId).name}</strong><small>{stretch.regionIds.map(id => regions[id].label).join(', ')} · {stretch.prescribedHoldSeconds} sec × {stretch.prescribedSets}</small></span><span className="historical-status">{stretch.status === 'completed' ? <Check size={15} /> : <SkipForward size={15} />}{stretch.status === 'completed' ? 'Complete' : 'Partial'}</span></summary>
      <ul className="historical-holds">{stretch.holds.map((hold, index) => <li key={index}><span>Set {hold.setNumber} · {hold.side ? `${hold.side === 'left' ? 'Left' : 'Right'} side` : 'Both sides'}</span><span>{(hold.actualMilliseconds / 1000).toFixed(1)} / {hold.prescribedSeconds} sec</span><span>{hold.status === 'completed' ? 'Completed' : 'Skipped'}</span></li>)}</ul></details>)}</div>
  </main>
}
