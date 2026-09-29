import { programs } from '../../data/programs'
import { filterProgramHistory, historySessionName } from '../../lib/history'
import type { HistoryProgramFilter } from '../../lib/history'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { regions } from '../../data/regions'
import { regionIds } from '../../types/stretch'
import type { RegionId } from '../../types/stretch'
import type { HistoryEntry } from '../../types/history'
import type { BaselineAssessment } from '../../types/profile'
import { clockText } from '../../lib/stretch'
import { historyTotals, newestHistory, regionHistory } from '../../lib/history'
import { baselineAreas, baselineForRegion, perceptionLabels } from '../../lib/profile'
import { displayDate } from '../../lib/dates'
import { PageHeading } from '../PageHeading'
import { isFlexibilityHistory, isMobilityHistory, mobilityHistoryName, mobilityHistoryTotals } from '../../lib/mobilityHistory'
export function ProgressPage({ history, baseline, onDetail, onBack, onBaseline }: { history: HistoryEntry[]; baseline: BaselineAssessment[]; onDetail: (entry: HistoryEntry) => void; onBack: () => void; onBaseline: () => void }) {
  const [activity, setActivity] = useState<'flexibility' | 'mobility'>('flexibility')
  const [region, setRegion] = useState<RegionId | ''>('')
  const [programFilter, setProgramFilter] = useState<HistoryProgramFilter>('all')
  const flexibility = history.filter(isFlexibilityHistory)
  const mobility = newestHistory(history.filter(isMobilityHistory))
  const filtered = filterProgramHistory(flexibility, programFilter)
  const totals = historyTotals(filtered)
  const regionStats = region ? regionHistory(filtered, region) : null
  const original = region ? baselineForRegion(baseline, region, 'original') : null
  const entries = regionStats?.entries ?? newestHistory(filtered)
  const activityControl = <label className="region-filter">Activity<select aria-label="Activity history filter" value={activity} onChange={event => setActivity(event.target.value as 'flexibility' | 'mobility')}><option value="flexibility">Flexibility</option><option value="mobility">Mobility</option></select></label>
  if (activity === 'mobility') {
    const stats = mobilityHistoryTotals(mobility)
    return <main id="main" className="secondary-page progress-page"><PageHeading title="Keep showing up." eyebrow="Progress" onBack={onBack} />{activityControl}
      <div className="progress-totals"><div><b>{stats.sessions}</b><span>Warm-ups finished</span></div><div><b>{stats.completed}</b><span>Movements completed</span></div><div><b>{clockText(stats.seconds)}</b><span>Total session time</span></div></div>
      <section aria-labelledby="mobility-history-title"><h2 className="section-title" id="mobility-history-title">Mobility history</h2>{mobility.length ? <div className="history-list">{mobility.map(entry => {
        const complete = entry.movements.filter(item => item.status === 'completed').length
        return <button className="history-row" key={entry.id} onClick={() => onDetail(entry)}><span className="history-date">{displayDate(entry.completedAt)}</span><span className="history-row-content"><small className="activity-tag">Mobility</small><strong>{mobilityHistoryName(entry)}</strong><span>{complete} / {entry.movements.length} movements completed</span><span>{clockText(entry.durationSeconds)} session duration</span></span><ArrowRight size={18} aria-hidden="true" /></button>
      })}</div> : <div className="empty-state">Finish a warm-up to see it here.</div>}</section>
      <p className="mobility-map-note">Mobility time and movements are separate from flexibility hold time and self-assessments.</p>
    </main>
  }
  return <main id="main" className="secondary-page progress-page"><PageHeading title="Keep showing up." eyebrow="Progress" onBack={onBack} />
    {activityControl}
    <div className="progress-totals"><div><b>{totals.sessions}</b><span>Finished sessions</span></div><div><b>{totals.days}</b><span>Days with a completed stretch</span></div><div><b>{clockText(totals.holdSeconds)}</b><span>Total hold time</span></div></div>
    <label className="region-filter">Program<select aria-label="Program history filter" value={programFilter} onChange={event => setProgramFilter(event.target.value as HistoryProgramFilter)}><option value="all">All</option>{programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}<option value="targeted">Targeted</option></select></label>
    <label className="region-filter">Region<select value={region} onChange={event => setRegion(event.target.value as RegionId | '')}><option value="">All regions</option>{regionIds.map(id => <option value={id} key={id}>{regions[id].label}</option>)}</select></label>
    {regionStats && region && <section className="region-history" aria-label={`${regions[region].label} history`}><h2>{regions[region].label}</h2><dl><div><dt>Finished sessions</dt><dd>{regionStats.sessions}</dd></div><div><dt>Last stretched</dt><dd>{regionStats.lastStretched ? displayDate(regionStats.lastStretched) : 'Not yet'}</dd></div><div><dt>Completed holds</dt><dd>{regionStats.holds}</dd></div><div><dt>Total hold time</dt><dd>{clockText(regionStats.holdSeconds)}</dd></div><div><dt>Starting self-assessment</dt><dd>{original ? perceptionLabels[original.perception] : 'Not established'}{original && <small>Recorded {displayDate(original.recordedAt)}</small>}</dd></div></dl></section>}
    <section aria-labelledby="history-title"><h2 id="history-title" className="section-title">Stretch history</h2>{!entries.length ? <div className="empty-state"><p>{region ? 'No finished sessions for this region yet.' : programFilter === 'all' ? 'Finish your first stretch to see it here.' : 'No finished sessions for this program yet.'}</p></div> : <div className="history-list">{entries.map(entry => {
      const summary = historyTotals([entry])
      return <button className="history-row" key={entry.id} onClick={() => onDetail(entry)}><span className="history-date">{displayDate(entry.completedAt)}</span><span className="history-row-content"><small className="activity-tag">Flexibility</small><strong>{entry.sessionType === 'program' ? historySessionName(entry) : `Targeted · ${regions[entry.stretches[0].regionIds[0]].label}`}</strong><span>{summary.stretches} / {summary.prescribedStretches} stretches fully completed · {summary.holds} / {summary.prescribedHolds} holds</span><span>{clockText(summary.holdSeconds)} hold time</span></span><ArrowRight size={18} aria-hidden="true" /></button>
    })}</div>}</section>
    <section className="progress-baseline" aria-labelledby="starting-baseline-title"><h2 id="starting-baseline-title" className="section-title">Starting self-assessment</h2>{baseline.length ? <div className="baseline-summary">{baselineAreas.map(area => {
      const response = baselineForRegion(baseline, area.regionIds[0], 'original')
      return <div key={area.id}><span>{area.label}{response && <small>{displayDate(response.recordedAt)}</small>}</span><strong>{response ? perceptionLabels[response.perception] : 'Not established'}</strong></div>
    })}</div> : <p className="muted">Baseline not established.</p>}<button className="text-button" onClick={onBaseline}>{baseline.length ? 'View original & latest' : 'Complete self-assessment'}<ArrowRight size={15} /></button></section>
  </main>
}
