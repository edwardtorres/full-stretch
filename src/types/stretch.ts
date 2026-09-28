export const regionIds = ['chest', 'shoulders', 'biceps', 'triceps', 'upper-back', 'lats', 'abs', 'hip-flexors', 'glutes', 'adductors', 'quadriceps', 'hamstrings', 'calves'] as const
export type RegionId = typeof regionIds[number]
export type BodyView = 'front' | 'back'
export interface Stretch {
  id: string
  name: string
  primaryRegions: RegionId[]
  secondaryRegions?: RegionId[]
  unilateral: boolean
  defaultHoldSeconds: number
  defaultSets: number
  setupCues: string[]
  stretchCues: string[]
  safetyCue: string
  equipment: string[]
  position: 'standing' | 'kneeling' | 'seated' | 'floor'
}
export interface HoldStep { set: number; side: 'left' | 'right' | null; seconds: number }
export interface HoldResult { step: HoldStep; status: 'completed' | 'skipped'; heldMs: number }
