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
import { baselineForRegion, perceptionLabels } from '../../lib/profile'
import { displayDate } from '../../lib/dates'
import { PageHeading } from '../PageHeading'
import { isFlexibilityHistory, isMobilityHistory, mobilityHistoryName, mobilityHistoryTotals } from '../../lib/mobilityHistory'
import { deriveMilestones, flexibilityThisWeek, getBaselineChanges, getCoverageSummary, getMobilityConsistency, getMobilityRegionUse, getWeekStreaks } from '../../lib/analytics'
import type { CoverageWindow } from '../../lib/analytics'
import type { WeeklySchedule } from '../../types/schedule'
import type { WeekSnapshot } from '../../lib/weekSnapshots'
import { milestoneProgress } from '../../lib/presentation'
import { mobilityRoutines } from '../../data/mobility'
export function ProgressPage({ history, baseline, schedule, weeks, today, onDetail, onBack, onBaseline }: { history: HistoryEntry[]; baseline: BaselineAssessment[]; schedule: WeeklySchedule; weeks: WeekSnapshot[]; today: Date; onDetail: (entry: HistoryEntry) => void; onBack: () => void; onBaseline: () => void }) {
  const [activity, setActivity] = useState<'flexibility' | 'mobility'>('flexibility')
  const [window, setWindow] = useState<CoverageWindow>('recent')
  const [region, setRegion] = useState<RegionId | ''>('')
  const [programFilter, setProgramFilter] = useState<HistoryProgramFilter>('all')
  const flexibility = history.filter(isFlexibilityHistory)
  const mobility = newestHistory(history.filter(isMobilityHistory))
  const filtered = filterProgramHistory(flexibility, programFilter)
    const regionStats = region ? regionHistory(filtered, region) : null
  const original = region ? baselineForRegion(baseline, region, 'original') : null
  const entries = regionStats?.entries ?? newestHistory(filtered)
  const activityControl = <label className="region-filter">Activity<select aria-label="Activity history filter" value={activity} onChange={event => setActivity(event.target.value as 'flexibility' | 'mobility')}><option value="flexibility">Flexibility</option><option value="mobility">Mobility</option></select></label>
  const flexWeek = flexibilityThisWeek(flexibility, schedule, today)
  const streak = getWeekStreaks(weeks, flexibility, today)
  const mobilityWeek = getMobilityConsistency(mobility, today)
  const milestoneList = deriveMilestones(flexibility, mobility, baseline, weeks, today)
  if (activity === 'mobility') {
    const stats = mobilityHistoryTotals(mobility)
    return <main id="main" className="secondary-page progress-page"><PageHeading title="Keep showing up." eyebrow="Progress" onBack={onBack} />{activityControl}
      <div className="progress-totals"><div><b>{mobilityWeek.thisWeek}</b><span>Warm-ups this week</span></div><div><b>{stats.sessions}</b><span>Lifetime warm-ups</span></div><div><b>{stats.completed}</b><span>Movements completed</span></div><div><b>{clockText(stats.seconds)}</b><span>Total session time</span></div></div>
      <section className="insight-section" aria-labelledby="mobility-consistency"><h2 className="section-title" id="mobility-consistency">Mobility consistency</h2><h3>Routine mix</h3><ul className="insight-list">{mobilityRoutines.map(routine => <li key={routine.id}><span>{routine.name}</span><strong>{mobilityWeek.routineCounts.get(routine.id) ?? 0} warm-ups</strong></li>)}</ul></section>
      <section className="insight-section" aria-labelledby="mobility-regions"><h2 className="section-title" id="mobility-regions">Most used movement regions</h2><p className="muted">Warm-ups with a completed movement for each region. This describes activity, not flexibility.</p>{getMobilityRegionUse(mobility).length ? <ul className="insight-list">{getMobilityRegionUse(mobility).slice(0, 5).map(item => <li key={item.region}><span>{regions[item.region].label}</span><strong>{item.warmups} warm-ups</strong></li>)}</ul> : <p className="empty-state">Complete warm-up movements to see your most-used regions here.</p>}</section>
      <section aria-labelledby="mobility-history-title"><h2 className="section-title" id="mobility-history-title">Mobility history</h2>{mobility.length ? <div className="history-list">{mobility.map(entry => {
        const complete = entry.movements.filter(item => item.status === 'completed').length
        return <button className="history-row" key={entry.id} onClick={() => onDetail(entry)}><span className="history-date">{displayDate(entry.completedAt)}</span><span className="history-row-content"><small className="activity-tag">Mobility</small><strong>{mobilityHistoryName(entry)}</strong><span>{complete} / {entry.movements.length} movements completed</span><span>{clockText(entry.durationSeconds)} session duration</span></span><ArrowRight size={18} aria-hidden="true" /></button>
      })}</div> : <div className="empty-state">No Mobility history yet. Complete a warm-up to begin tracking your Mobility sessions.</div>}</section>
      <p className="mobility-map-note">Mobility time and movements are separate from flexibility hold time and self-assessments.</p>
    </main>
  }
  return <main id="main" className="secondary-page progress-page"><PageHeading title="Keep showing up." eyebrow="Progress" onBack={onBack} />
    {activityControl}
    <section className="insight-section" aria-labelledby="flex-consistency"><h2 className="section-title" id="flex-consistency">Flexibility consistency</h2>{!flexibility.length && <p className="insight-note">Complete a stretch or program to build your session and weekly history.</p>}<div className="insight-grid"><div><b>{flexWeek.sessions}</b><span>Sessions this week</span></div><div><b>{flexWeek.scheduled.finished} / {flexWeek.scheduled.scheduled}</b><span>Scheduled programs finished</span></div><div><b>{streak.current}</b><span>Current week streak</span></div><div><b>{streak.best}</b><span>Best week streak</span></div></div><p className="insight-note">This week · {flexWeek.regions} regions · {flexWeek.holds} completed holds · {clockText(flexWeek.holdSeconds)} hold time</p>{flexWeek.scheduled.complete && <p className="complete-week">Complete Week · All {flexWeek.scheduled.finished} scheduled flexibility {flexWeek.scheduled.finished === 1 ? 'session' : 'sessions'} finished</p>}<p className="insight-note">Only weeks whose schedules were recorded by this version can count toward streaks. Weeks without scheduled programs do not count.</p></section>
    <section className="insight-section" aria-labelledby="coverage-title"><h2 className="section-title" id="coverage-title">Static stretch coverage</h2><label className="region-filter">Window<select aria-label="Coverage window" value={window} onChange={event => setWindow(event.target.value as CoverageWindow)}><option value="recent">Recent · last 42 days</option><option value="all">All Time</option></select></label><p className="insight-note">Well Covered: frequently included. Less Covered: included less often in your recent stretching. Labels describe frequency, not flexibility.</p>{!flexibility.length && <p className="empty-state"><strong>Building Data</strong><br />Complete more stretching sessions to build your recent coverage history.</p>}<ul className="coverage-list">{getCoverageSummary(flexibility, window, today).map(item => <li key={item.region} className={`coverage-${item.label.toLowerCase().replaceAll(' ', '-')}`}><div><strong>{regions[item.region].label}</strong><span>{item.label}</span></div><small>{item.days} {item.days === 1 ? 'day' : 'days'} stretched · Last stretched: {item.lastStretched ? displayDate(item.lastStretched) : 'Not yet'}</small></li>)}</ul></section>
    <section className="insight-section" aria-labelledby="baseline-changes"><h2 className="section-title" id="baseline-changes">Self-reported baseline</h2><p className="insight-note">These are your own responses, not measured range of motion.</p>{!baseline.length && <p className="empty-state">Record a self-assessment to compare your original and latest responses here.</p>}{baseline.length > 0 && <ul className="insight-list">{getBaselineChanges(baseline).map(item => <li key={item.id}><span>{item.label}<small>Original: {item.original ? perceptionLabels[item.original.perception] : 'Not assessed'} · Latest: {item.latest ? perceptionLabels[item.latest.perception] : 'Not assessed'}</small></span><strong>{item.status}</strong></li>)}</ul>}<button className="text-button" onClick={onBaseline}>{baseline.length ? 'View baseline / retake' : 'Complete self-assessment'}<ArrowRight size={15} /></button></section>
    <section className="insight-section" aria-labelledby="milestones"><h2 className="section-title" id="milestones">Milestones</h2><p className="insight-note">Complete sessions, scheduled weeks, and self-assessments to earn these milestones.</p><ul className="milestone-list">{milestoneList.map(item => <li key={item.id} className={item.earned ? 'earned' : ''}><div><strong>{item.name}</strong><span>{item.description}</span></div><small>{item.earned ? `Milestone earned · ${item.earnedAt ? displayDate(item.earnedAt) : ''}` : milestoneProgress(item.id, flexibility, mobility, streak.best) ?? 'Not yet earned'}</small></li>)}</ul></section>
    <label className="region-filter">Program<select aria-label="Program history filter" value={programFilter} onChange={event => setProgramFilter(event.target.value as HistoryProgramFilter)}><option value="all">All</option>{programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}<option value="targeted">Targeted</option></select></label>
    <label className="region-filter">Region<select value={region} onChange={event => setRegion(event.target.value as RegionId | '')}><option value="">All regions</option>{regionIds.map(id => <option value={id} key={id}>{regions[id].label}</option>)}</select></label>
    {regionStats && region && <section className="region-history" aria-label={`${regions[region].label} history`}><h2>{regions[region].label}</h2><dl><div><dt>Finished sessions</dt><dd>{regionStats.sessions}</dd></div><div><dt>Last stretched</dt><dd>{regionStats.lastStretched ? displayDate(regionStats.lastStretched) : 'Not yet'}</dd></div><div><dt>Completed holds</dt><dd>{regionStats.holds}</dd></div><div><dt>Total hold time</dt><dd>{clockText(regionStats.holdSeconds)}</dd></div><div><dt>Starting self-assessment</dt><dd>{original ? perceptionLabels[original.perception] : 'Not established'}{original && <small>Recorded {displayDate(original.recordedAt)}</small>}</dd></div></dl></section>}
    <section aria-labelledby="history-title"><h2 id="history-title" className="section-title">Stretch history</h2>{!entries.length ? <div className="empty-state"><p>{region ? 'Finish a stretch for this region to see its session history.' : programFilter === 'all' ? 'Complete a targeted stretch or program to see your session details here.' : 'Finish this program to see its session details here.'}</p></div> : <div className="history-list">{entries.map(entry => {
      const summary = historyTotals([entry])
      return <button className="history-row" key={entry.id} onClick={() => onDetail(entry)}><span className="history-date">{displayDate(entry.completedAt)}</span><span className="history-row-content"><small className="activity-tag">Flexibility</small><strong>{entry.sessionType === 'program' ? historySessionName(entry) : `Targeted · ${regions[entry.stretches[0].regionIds[0]].label}`}</strong><span>{summary.stretches} / {summary.prescribedStretches} stretches fully completed · {summary.holds} / {summary.prescribedHolds} holds</span><span>{clockText(summary.holdSeconds)} hold time</span></span><ArrowRight size={18} aria-hidden="true" /></button>
    })}</div>}</section>
  </main>
}
