import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { addAssessment, baselineAreas, baselineForRegion, createAssessment, perceptionLabels } from '../../lib/profile'
import { displayDate } from '../../lib/dates'
import type { BaselinePerception, ProfileDocument } from '../../types/profile'
import { BaselineQuestions } from './BaselineQuestions'
import { PageHeading } from '../PageHeading'
export function BaselinePage({ document, onSave, onBack }: { document: ProfileDocument; onSave: (value: ProfileDocument) => void; onBack: () => void }) {
  const [editing, setEditing] = useState(false)
  const [answers, setAnswers] = useState<Record<string, BaselinePerception>>({})
  const assessments = document.profile.baseline
  return <main id="main" className="secondary-page baseline-page"><PageHeading key={editing ? 'edit' : 'view'} title={editing ? 'How does stretching feel?' : 'Your self-assessment.'} eyebrow="Baseline" onBack={editing ? () => setEditing(false) : onBack} backLabel={editing ? 'Back to baseline' : undefined} />
    <p className="page-intro">A self-reported starting point. Think about your usual experience; no physical test is needed.</p>
    {editing ? <form onSubmit={event => { event.preventDefault(); onSave(addAssessment(document, createAssessment(answers))); setEditing(false); setAnswers({}) }}><BaselineQuestions answers={answers} onChange={setAnswers} /><button className="primary-button" type="submit">Save self-assessment<ArrowRight size={17} /></button></form> : <>
      {!assessments.length ? <div className="empty-state"><h2>Baseline not established.</h2><p>Complete it whenever you’re ready.</p></div> : <><div className="baseline-table"><div className="baseline-table-heading"><span>Area</span><span>Original</span><span>Your latest response</span></div>{baselineAreas.map(area => {
        const original = baselineForRegion(assessments, area.regionIds[0], 'original')
        const latest = baselineForRegion(assessments, area.regionIds[0], 'latest')
        return <div className="baseline-table-row" key={area.id}><strong>{area.label}</strong><span><b>{original ? perceptionLabels[original.perception] : 'Not assessed'}</b>{original && <small>{displayDate(original.recordedAt)}</small>}</span><span><b>{latest ? perceptionLabels[latest.perception] : 'Not assessed'}</b>{latest && <small>{displayDate(latest.recordedAt)}</small>}</span></div>
      })}</div><p className="muted baseline-footnote">{assessments.length} saved {assessments.length === 1 ? 'assessment' : 'assessments'}. Responses describe your experience; they are not a measured change in range of motion.</p></>}
      <button className="outline-button" onClick={() => { setAnswers({}); setEditing(true) }}>{assessments.length ? 'Retake self-assessment' : 'Complete self-assessment'}<ArrowRight size={17} /></button>
    </>}
  </main>
}
