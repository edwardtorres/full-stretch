import { baselineAreas, perceptionLabels } from '../../lib/profile'
import { perceptions } from '../../types/profile'
import type { BaselinePerception } from '../../types/profile'
export function BaselineQuestions({ answers, onChange }: { answers: Record<string, BaselinePerception>; onChange: (answers: Record<string, BaselinePerception>) => void }) {
  return <div className="baseline-questions">{baselineAreas.map((area, index) => <fieldset key={area.id}><legend><span className="mini-label">{String(index + 1).padStart(2, '0')}</span> {area.label}</legend><p>How does this area usually feel when you stretch it?</p><div className="baseline-options">{perceptions.map(perception => <label className="choice-label" key={perception}><input type="radio" required name={`baseline-${area.id}`} value={perception} checked={answers[area.id] === perception} onChange={() => onChange({ ...answers, [area.id]: perception })} /><span>{perceptionLabels[perception]}</span></label>)}</div></fieldset>)}</div>
}
