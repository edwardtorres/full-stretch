import { getStretch, isStretchComplete } from './stretch'
import { prescribedStretch } from './session'
import type { SessionState } from './session'
import type { RegionId } from '../types/stretch'
import { regionIds } from '../types/stretch'
export const calfProgramIds = ['straight-knee-wall-calf-stretch', 'bent-knee-wall-calf-stretch'] as const
export function completedStretchIds(state: SessionState): Set<string> {
  return new Set(state.ids.filter(id => isStretchComplete(prescribedStretch(state, id), state.results[id])))
}
// Coverage can require several stretches; it is deliberately separate from completion.
export function regionCoverage(completeIds: ReadonlySet<string>, prescribedIds: readonly string[]): Set<RegionId> {
  return new Set(regionIds.filter(region => {
    const required = region === 'calves' ? [...calfProgramIds] : prescribedIds.filter(id => getStretch(id).primaryRegions.includes(region))
    return required.length > 0 && required.every(id => completeIds.has(id))
  }))
}
export function programRegionCoverage(completeIds: ReadonlySet<string>, prescribedIds: readonly string[]): Set<RegionId> {
  return new Set(regionIds.filter(region => {
    const included = prescribedIds.filter(id => getStretch(id).primaryRegions.includes(region))
    return included.length > 0 && included.every(id => completeIds.has(id))
  }))
}
export const coveredRegionIds = (state: SessionState) => state.kind === 'program' ? programRegionCoverage(completedStretchIds(state), state.ids) : regionCoverage(completedStretchIds(state), state.ids)
