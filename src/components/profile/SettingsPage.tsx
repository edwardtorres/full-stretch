import { useState } from 'react'
import { Check } from 'lucide-react'
import type { ProfileDocument } from '../../types/profile'
import { ScheduleFields } from './ScheduleFields'
import { PreferencesFields } from './PreferencesFields'
import { PageHeading } from '../PageHeading'
import { ConfirmDialog } from '../ConfirmDialog'
export function SettingsPage({ document, onSave, onReset, onBack }: { document: ProfileDocument; onSave: (value: ProfileDocument) => void; onReset: () => boolean; onBack: () => void }) {
  const [preferences, setPreferences] = useState(document.profile.preferences)
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState(false)
  return <main id="main" className="secondary-page settings-page"><PageHeading title="Make it yours." eyebrow="Settings" onBack={onBack} />
    <section aria-labelledby="defaults-heading"><h2 id="defaults-heading">Session defaults</h2><p className="page-intro">Apply to new sessions. Your current stretch and saved history keep their original prescription.</p><form onSubmit={event => { event.preventDefault(); onSave({ ...document, profile: { ...document.profile, preferences: { ...preferences } } }); setSaved(true) }}><PreferencesFields value={preferences} onChange={value => { setPreferences(value); setSaved(false) }} /><button className="primary-button" type="submit">Save defaults{saved ? <Check size={17} /> : null}</button><p className="saved-message" role="status">{saved ? 'Defaults updated.' : ''}</p></form></section>
    <section className="weekly-settings" aria-labelledby="schedule-heading"><h2 id="schedule-heading">Weekly schedule</h2><p className="page-intro">One program per day, with room for days off. Changes save immediately; you can always choose another program.</p><ScheduleFields value={document.profile.weeklySchedule} onChange={weeklySchedule => { onSave({ ...document, profile: { ...document.profile, weeklySchedule } }); setScheduleSaved(true) }} /><p className="saved-message" role="status">{scheduleSaved ? 'Schedule updated.' : ''}</p></section>
    <section className="data-settings" aria-labelledby="data-heading"><h2 id="data-heading">Data</h2><p className="page-intro">Your setup and stretching history are stored in this browser.</p><button className="danger-button" onClick={() => setConfirm(true)}>Reset All Data</button></section>
    {confirm && <ConfirmDialog title="Reset all Full Stretch data?" onClose={() => setConfirm(false)}><p>This removes your setup/profile, weekly schedule, baseline assessments, active stretch, and completed stretch history from this browser.</p><p>This cannot be undone.</p><div className="confirm-actions"><button className="outline-button" onClick={() => setConfirm(false)}>Keep my data</button><button className="danger-button" onClick={() => { if (onReset()) setConfirm(false) }}>Reset All Data</button></div></ConfirmDialog>}
  </main>
}
