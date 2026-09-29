import { programs } from '../data/programs'
import { programIds } from '../types/program'
import type { ProgramId } from '../types/program'
import type { StretchPreferences } from '../types/profile'
import { getStretch, holdSequence, plannedHoldSeconds } from './stretch'
export const isProgramId = (value: unknown): value is ProgramId => programIds.includes(value as ProgramId)
export function getProgram(id: ProgramId) {
  const program = programs.find(item => item.id === id)
  if (!program) throw new Error(`Unknown program: ${id}`)
  return program
}
export const getProgramStretches = (id: ProgramId, preferences: StretchPreferences) => getProgram(id).stretchIds.map(stretchId => ({ ...getStretch(stretchId), defaultHoldSeconds: preferences.holdSeconds, defaultSets: preferences.sets }))
export const getProgramHoldCount = (id: ProgramId, preferences: StretchPreferences) => getProgramStretches(id, preferences).reduce((sum, stretch) => sum + holdSequence(stretch).length, 0)
export const getProgramPlannedHoldTime = (id: ProgramId, preferences: StretchPreferences) => plannedHoldSeconds(getProgramStretches(id, preferences))
export const getProgramCoveredRegions = (id: ProgramId) => [...new Set(getProgram(id).stretchIds.flatMap(stretchId => getStretch(stretchId).primaryRegions))]
