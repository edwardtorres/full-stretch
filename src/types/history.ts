import type { ProgramId } from './program'
import type { RegionId } from './stretch'
export interface HistoricalHold {
  setNumber: number
  side: 'left' | 'right' | null
  prescribedSeconds: number
  actualMilliseconds: number
  status: 'completed' | 'skipped'
}
export interface HistoricalStretch {
  stretchId: string
  regionIds: RegionId[]
  prescribedHoldSeconds: number
  prescribedSets: number
  holds: HistoricalHold[]
  status: 'completed' | 'partial'
}
export interface StretchHistoryEntry {
  id: string
  sessionType: 'targeted' | 'program'
  programId: ProgramId | null
  startedAt: string
  completedAt: string
  durationSeconds: number
  stretches: HistoricalStretch[]
}
