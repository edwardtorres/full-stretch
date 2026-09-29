import { defaultSchedule, normalizeSchedule, validSchedule } from './schedule'
import { regionIds } from '../types/stretch'
import { holdLengths, perceptions, setCounts, stretchIntents } from '../types/profile'
import type { BaselineAssessment, BaselinePerception, ProfileDocument, StretchPreferences } from '../types/profile'
import type { RegionId } from '../types/stretch'
export const intentLabels = { 'improve-flexibility': 'Improve flexibility', 'stay-consistent': 'Stay consistent', unwind: 'Recover / unwind', 'complement-workouts': 'Complement workouts' }
export const perceptionLabels: Record<BaselinePerception, string> = { comfortable: 'Comfortable', 'moderately-tight': 'Moderately tight', 'very-tight': 'Very tight', unsure: 'Not sure' }
export const baselineAreas: { id: string; label: string; regionIds: RegionId[] }[] = [
  { id: 'shoulders-chest', label: 'Shoulders / chest', regionIds: ['shoulders', 'chest'] },
  { id: 'upper-back-lats', label: 'Upper back / lats', regionIds: ['upper-back', 'lats'] },
  { id: 'hip-flexors', label: 'Hip flexors', regionIds: ['hip-flexors'] },
  { id: 'glutes', label: 'Glutes', regionIds: ['glutes'] },
  { id: 'adductors', label: 'Inner thighs', regionIds: ['adductors'] },
  { id: 'quadriceps', label: 'Quadriceps', regionIds: ['quadriceps'] },
  { id: 'hamstrings', label: 'Hamstrings', regionIds: ['hamstrings'] },
  { id: 'calves', label: 'Calves', regionIds: ['calves'] },
]
export const defaultPreferences = (): StretchPreferences => ({ holdSeconds: 30, sets: 2 })
export const defaultProfile = (): ProfileDocument => ({ profile: { intentions: ['improve-flexibility'], preferences: defaultPreferences(), baseline: [], weeklySchedule: defaultSchedule() }, onboarding: { completed: false } })
export const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
export const isoInstant = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value))
export function validPreferences(value: unknown): value is StretchPreferences {
  return object(value) && holdLengths.includes(value.holdSeconds as StretchPreferences['holdSeconds']) && setCounts.includes(value.sets as StretchPreferences['sets'])
}
export function createAssessment(answers: Record<string, BaselinePerception>, recordedAt = new Date().toISOString(), id: string = crypto.randomUUID()): BaselineAssessment {
  if (!baselineAreas.every(area => perceptions.includes(answers[area.id]))) throw new Error('Choose a response for each area, or skip the baseline.')
  return { id, recordedAt, results: baselineAreas.flatMap(area => area.regionIds.map(regionId => ({ regionId, perception: answers[area.id], recordedAt }))) }
}
export function baselineForRegion(assessments: BaselineAssessment[], region: RegionId, which: 'original' | 'latest' = 'latest') {
  const matching = [...assessments].sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt)).filter(assessment => assessment.results.some(result => result.regionId === region))
  return (which === 'original' ? matching[0] : matching.at(-1))?.results.find(result => result.regionId === region)
}
export function addAssessment(document: ProfileDocument, assessment: BaselineAssessment): ProfileDocument {
  return document.profile.baseline.some(item => item.id === assessment.id) ? document : { ...document, profile: { ...document.profile, baseline: [...document.profile.baseline, assessment] } }
}
export function validAssessment(value: unknown): value is BaselineAssessment {
  if (!object(value) || typeof value.id !== 'string' || !value.id || !isoInstant(value.recordedAt) || !Array.isArray(value.results)) return false
  const expected = baselineAreas.flatMap(area => area.regionIds)
  return value.results.length === expected.length && new Set(value.results.map(result => object(result) ? result.regionId : null)).size === expected.length && value.results.every(result => object(result) && regionIds.includes(result.regionId as RegionId) && expected.includes(result.regionId as RegionId) && perceptions.includes(result.perception as BaselinePerception) && result.recordedAt === value.recordedAt)
}
export function validProfile(value: unknown): value is ProfileDocument {
  return object(value) && object(value.profile) && object(value.onboarding) && typeof value.onboarding.completed === 'boolean' && Array.isArray(value.profile.intentions) && value.profile.intentions.length > 0 && new Set(value.profile.intentions).size === value.profile.intentions.length && value.profile.intentions.every(intent => stretchIntents.includes(intent as typeof stretchIntents[number])) && validPreferences(value.profile.preferences) && validSchedule(value.profile.weeklySchedule) && Array.isArray(value.profile.baseline) && value.profile.baseline.every(validAssessment) && new Set(value.profile.baseline.map(item => item.id)).size === value.profile.baseline.length
}

export function normalizeProfile(value: unknown): ProfileDocument | null {
  if (!object(value) || !object(value.profile)) return null
  const next = { ...value, profile: { ...value.profile, weeklySchedule: normalizeSchedule(value.profile.weeklySchedule) } }
  return validProfile(next) ? next : null
}
