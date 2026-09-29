import type { RegionId } from './stretch'

export const mobilityMovementIds = ['march-in-place', 'arm-circles', 'shoulder-rolls', 'standing-torso-rotation', 'bodyweight-squat', 'hip-hinge-reach', 'reverse-lunge-with-reach', 'front-to-back-leg-swing', 'side-to-side-leg-swing', 'ankle-rock', 'wall-slide', 'cat-cow'] as const
export type MobilityMovementId = typeof mobilityMovementIds[number]
export const mobilityRoutineIds = ['full-body-warmup', 'upper-body-warmup', 'lower-body-warmup'] as const
export type MobilityRoutineId = typeof mobilityRoutineIds[number]
export type MobilityPrescription =
  | { kind: 'seconds'; seconds: number }
  | { kind: 'reps'; reps: number; perSide: boolean; directions?: readonly { label: string; reps: number }[] }
export interface MobilityMovement {
  id: MobilityMovementId
  name: string
  primaryRegions: readonly RegionId[]
  secondaryRegions?: readonly RegionId[]
  prescription: MobilityPrescription
  purpose: string
  setupCues: readonly string[]
  movementCues: readonly string[]
  safetyCue: string
  equipment: readonly string[]
  position: 'standing' | 'floor'
}
export interface MobilityRoutineStep { movementId: MobilityMovementId; prescription?: MobilityPrescription }
export interface MobilityRoutine {
  id: MobilityRoutineId
  name: string
  description: string
  expectedMinutes: string
  steps: readonly MobilityRoutineStep[]
}
