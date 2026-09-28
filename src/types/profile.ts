import type { RegionId } from './stretch'
export const stretchIntents = ['improve-flexibility', 'stay-consistent', 'unwind', 'complement-workouts'] as const
export type StretchIntent = typeof stretchIntents[number]
export const holdLengths = [20, 30, 45] as const
export const setCounts = [1, 2, 3] as const
export interface StretchPreferences { holdSeconds: typeof holdLengths[number]; sets: typeof setCounts[number] }
export const perceptions = ['comfortable', 'moderately-tight', 'very-tight', 'unsure'] as const
export type BaselinePerception = typeof perceptions[number]
export interface FlexibilityBaselineResult { regionId: RegionId; perception: BaselinePerception; recordedAt: string }
export interface BaselineAssessment { id: string; recordedAt: string; results: FlexibilityBaselineResult[] }
export interface StretchProfile { intentions: StretchIntent[]; preferences: StretchPreferences; baseline: BaselineAssessment[] }
export interface StretchOnboardingState { completed: boolean }
export interface ProfileDocument { profile: StretchProfile; onboarding: StretchOnboardingState }
