import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { regions } from '../../data/regions'
import { regionIds } from '../../types/stretch'
import type { RegionId } from '../../types/stretch'
import type { StretchHistoryEntry } from '../../types/history'
import type { BaselineAssessment } from '../../types/profile'
import { clockText } from '../../lib/stretch'
import { historyTotals, newestHistory, regionHistory } from '../../lib/history'
import { baselineAreas, baselineForRegion, perceptionLabels } from '../../lib/profile'
import { displayDate } from '../../lib/dates'
import { PageHeading } from '../PageHeading'
export function ProgressPage({ history, baseline, onDetail, onBack, onBaseline }: { history: StretchHistoryEntry[]; baseline: BaselineAssessment[]; onDetail: (entry: StretchHistoryEntry) => void; onBack: () => void; onBaseline: () => void }) {
  const [region, setRegion] = useState<RegionId | ''>('')
  const totals = historyTotals(history)
  const regionStats = region ? regionHistory(history, region) : null
  const original = region ? baselineForRegion(baseline, region, 'original') : null
  const entries = regionStats?.entries ?? newestHistory(history)
  return <main id="main" className="secondary-page progress-page"><PageHeading title="Keep showing up." eyebrow="Progress" onBack={onBack} />
    <div className="progress-totals"><div><b>{totals.sessions}</b><span>Finished sessions</span></div><div><b>{totals.days}</b><span>Days with a completed stretch</span></div><div><b>{clockText(totals.holdSeconds)}</b><span>Total hold time</span></div></div>
    <label className="region-filter">Region<select value={region} onChange={event => setRegion(event.target.value as RegionId | '')}><option value="">All regions</option>{regionIds.map(id => <option value={id} key={id}>{regions[id].label}</option>)}</select></label>
    {regionStats && region && <section className="region-history" aria-label={`${regions[region].label} history`}><h2>{regions[region].label}</h2><dl><div><dt>Finished sessions</dt><dd>{regionStats.sessions}</dd></div><div><dt>Last stretched</dt><dd>{regionStats.lastStretched ? displayDate(regionStats.lastStretched) : 'Not yet'}</dd></div><div><dt>Completed holds</dt><dd>{regionStats.holds}</dd></div><div><dt>Total hold time</dt><dd>{clockText(regionStats.holdSeconds)}</dd></div><div><dt>Starting self-assessment</dt><dd>{original ? perceptionLabels[original.perception] : 'Not established'}{original && <small>Recorded {displayDate(original.recordedAt)}</small>}</dd></div></dl></section>}
    <section aria-labelledby="history-title"><h2 id="history-title" className="section-title">Stretch history</h2>{!entries.length ? <div className="empty-state"><p>{region ? 'No finished sessions for this region yet.' : 'Finish your first stretch to see it here.'}</p></div> : <div className="history-list">{entries.map(entry => {
      const summary = historyTotals([entry])
      return <button className="history-row" key={entry.id} onClick={() => onDetail(entry)}><span className="history-date">{displayDate(entry.completedAt)}</span><span className="history-row-content"><strong>{entry.sessionType === 'full-body' ? 'Full body stretch' : `Targeted · ${regions[entry.stretches[0].regionIds[0]].label}`}</strong><span>{summary.stretches} / {summary.prescribedStretches} stretches fully completed · {summary.holds} / {summary.prescribedHolds} holds</span><span>{clockText(summary.holdSeconds)} hold time</span></span><ArrowRight size={18} aria-hidden="true" /></button>
    })}</div>}</section>
    <section className="progress-baseline" aria-labelledby="starting-baseline-title"><h2 id="starting-baseline-title" className="section-title">Starting self-assessment</h2>{baseline.length ? <div className="baseline-summary">{baselineAreas.map(area => {
      const response = baselineForRegion(baseline, area.regionIds[0], 'original')
      return <div key={area.id}><span>{area.label}{response && <small>{displayDate(response.recordedAt)}</small>}</span><strong>{response ? perceptionLabels[response.perception] : 'Not established'}</strong></div>
    })}</div> : <p className="muted">Baseline not established.</p>}<button className="text-button" onClick={onBaseline}>{baseline.length ? 'View original & latest' : 'Complete self-assessment'}<ArrowRight size={15} /></button></section>
  </main>
}
