import { holdLengths, setCounts } from '../../types/profile'
import type { StretchPreferences } from '../../types/profile'
export function PreferencesFields({ value, onChange }: { value: StretchPreferences; onChange: (value: StretchPreferences) => void }) {
  return <div className="preference-fields"><fieldset><legend>Default hold length</legend><div className="choice-options">{holdLengths.map(seconds => <label key={seconds} className="choice-label"><input type="radio" name="hold-length" checked={value.holdSeconds === seconds} onChange={() => onChange({ ...value, holdSeconds: seconds })} /><span>{seconds} sec</span></label>)}</div></fieldset>
    <fieldset><legend>Default sets</legend><div className="choice-options">{setCounts.map(sets => <label key={sets} className="choice-label"><input type="radio" name="set-count" checked={value.sets === sets} onChange={() => onChange({ ...value, sets })} /><span>{sets} {sets === 1 ? 'set' : 'sets'}</span></label>)}</div></fieldset></div>
}
