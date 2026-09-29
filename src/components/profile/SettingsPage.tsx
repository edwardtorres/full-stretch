import { useState } from 'react'
import { Check } from 'lucide-react'
import type { ProfileDocument } from '../../types/profile'
import { ScheduleFields } from './ScheduleFields'
import { PreferencesFields } from './PreferencesFields'
import { PageHeading } from '../PageHeading'
import { ConfirmDialog } from '../ConfirmDialog'
export function SettingsPage({ document, onSave, onReset, onBack }: { document: ProfileDocument; onSave: (value: ProfileDocument) => boolean; onReset: () => boolean; onBack: () => void }) {
  const [preferences, setPreferences] = useState(document.profile.preferences)
  const [scheduleSaved, setScheduleSaved] = useState<boolean | null>(null)
  const [saved, setSaved] = useState<boolean | null>(null)
  const [confirm, setConfirm] = useState(false)
  return <main id="main" className="secondary-page settings-page"><PageHeading title="Make it yours." eyebrow="Settings" onBack={onBack} />
    <section aria-labelledby="defaults-heading"><h2 id="defaults-heading">Session defaults</h2><p className="page-intro">Apply to new static stretch sessions. Active sessions keep their original prescription.</p><form onSubmit={event => { event.preventDefault(); setSaved(onSave({ ...document, profile: { ...document.profile, preferences: { ...preferences } } })) }}><PreferencesFields value={preferences} onChange={value => { setPreferences(value); setSaved(null) }} /><button className="primary-button" type="submit">Save defaults{saved ? <Check size={17} /> : null}</button><p className="saved-message" role="status">{saved === null ? '' : saved ? 'Defaults saved.' : 'Defaults updated for this tab only. They could not be saved locally.'}</p></form></section>
    <section className="weekly-settings" aria-labelledby="schedule-heading"><h2 id="schedule-heading">Weekly schedule</h2><p className="page-intro">One program per day, with room for days off. Changes save immediately; you can always choose another program.</p><ScheduleFields value={document.profile.weeklySchedule} onChange={weeklySchedule => { setScheduleSaved(onSave({ ...document, profile: { ...document.profile, weeklySchedule } })) }} /><p className="saved-message" role="status">{scheduleSaved === null ? '' : scheduleSaved ? 'Schedule saved.' : 'Schedule updated for this tab only. It could not be saved locally.'}</p></section>
    <section className="data-settings" aria-labelledby="data-heading"><h2 id="data-heading">Data</h2><p className="page-intro">Your setup and session history stay in this browser.</p><button className="danger-button" onClick={() => setConfirm(true)}>Reset All Data</button></section>
    {confirm && <ConfirmDialog title="Reset all Full Stretch data?" onClose={() => setConfirm(false)}><p>This removes your setup/profile, baseline assessments, weekly schedule, active session, Flexibility history, Mobility history, and recorded week schedules from this browser. Coverage, streaks, and milestones derived from those records will also reset.</p><p>This cannot be undone.</p><div className="confirm-actions"><button className="outline-button" onClick={() => setConfirm(false)}>Keep my data</button><button className="danger-button" onClick={() => { if (onReset()) setConfirm(false) }}>Reset All Data</button></div></ConfirmDialog>}
  </main>
}
