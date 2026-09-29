import type { ActiveSession } from './storage'
// The app has one active slot for either activity. The caller resolves this
// conflict before starting a different session.
export const startRequiresResolution = (active: ActiveSession | null) => active !== null && active.phase !== 'complete'
