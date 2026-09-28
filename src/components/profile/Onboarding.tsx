import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { baselineAreas, createAssessment, intentLabels, perceptionLabels } from '../../lib/profile'
import { stretchIntents } from '../../types/profile'
import type { BaselinePerception, ProfileDocument } from '../../types/profile'
import { PreferencesFields } from './PreferencesFields'
import { BaselineQuestions } from './BaselineQuestions'
export function Onboarding({ initial, onComplete }: { initial: ProfileDocument; onComplete: (document: ProfileDocument) => void }) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(initial.profile)
  const [answers, setAnswers] = useState<Record<string, BaselinePerception>>({})
  const [skip, setSkip] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0 }) }, [step])
  const titles = ['What do you want from Full Stretch?', 'Make it your moment.', 'Your starting point.', 'Your starting profile.']
  const finish = () => {
    const baseline = skip ? draft.baseline : [...draft.baseline, createAssessment(answers)]
    onComplete({ profile: { ...draft, baseline }, onboarding: { completed: true } })
  }
  return <main id="main" className="setup-page"><div className="step-heading"><span className="eyebrow">A little setup</span><span className="mini-label">{step + 1} / 4</span></div>
    <h1 ref={heading} tabIndex={-1}>{titles[step]}</h1>
    {step === 0 && <><p className="page-intro">Choose what brings you here.</p><div className="intent-options">{stretchIntents.map(intent => <label className="intent-choice" key={intent}><input type="checkbox" checked={draft.intentions.includes(intent)} onChange={() => setDraft({ ...draft, intentions: draft.intentions.includes(intent) ? draft.intentions.filter(id => id !== intent) : [...draft.intentions, intent] })} /><span>{intentLabels[intent]}</span><Check size={17} aria-hidden="true" /></label>)}</div><button className="primary-button" disabled={!draft.intentions.length} onClick={() => setStep(1)}>Continue<ArrowRight size={17} /></button></>}
    {step === 1 && <><p className="page-intro">These defaults apply to each new session. You can change them later.</p><PreferencesFields value={draft.preferences} onChange={preferences => setDraft({ ...draft, preferences })} /><button className="primary-button" onClick={() => setStep(2)}>Continue<ArrowRight size={17} /></button></>}
    {step === 2 && <><p className="page-intro">Think about how stretching usually feels. This is a self-assessment, not a physical test.</p><form onSubmit={event => { event.preventDefault(); setSkip(false); setStep(3) }}><BaselineQuestions answers={answers} onChange={setAnswers} /><button className="primary-button" type="submit">Review profile<ArrowRight size={17} /></button></form><button className="text-button baseline-skip" onClick={() => { setSkip(true); setStep(3) }}>Skip baseline for now</button></>}
    {step === 3 && <><p className="page-intro">This is your self-reported starting point. Full Stretch will use completed sessions to help you track consistency over time.</p><p className="summary-preferences">{draft.preferences.holdSeconds} sec × {draft.preferences.sets} {draft.preferences.sets === 1 ? 'set' : 'sets'}</p>{skip ? <p className="empty-state">Baseline not established. You can complete it later.</p> : <div className="baseline-summary">{baselineAreas.map(area => <div key={area.id}><span>{area.label}</span><strong>{perceptionLabels[answers[area.id]]}</strong></div>)}</div>}<button className="primary-button" onClick={finish}>Start stretching<ArrowRight size={17} /></button></>}
    {step > 0 && <button className="text-button setup-back" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button>}
  </main>
}
