import type { ProgramId } from './program'
import type { RegionId } from './stretch'
import type { MobilityRoutineId, MobilityMovementId, MobilityPrescription } from './mobility'
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
  activityType: 'flexibility'
  id: string
  sessionType: 'targeted' | 'program'
  programId: ProgramId | null
  startedAt: string
  completedAt: string
  durationSeconds: number
  stretches: HistoricalStretch[]
}
export interface HistoricalMobilityMovement {
  movementId: MobilityMovementId
  prescription: MobilityPrescription
  status: 'completed' | 'skipped'
  actualTimedMs: number | null
}
export interface MobilityHistoryEntry {
  activityType: 'mobility'
  id: string
  routineId: MobilityRoutineId
  startedAt: string
  completedAt: string
  durationSeconds: number
  movements: HistoricalMobilityMovement[]
}
export type HistoryEntry = StretchHistoryEntry | MobilityHistoryEntry
