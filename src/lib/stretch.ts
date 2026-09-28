import { fullBodyIds, stretches } from '../data/stretches'
import type { HoldResult, HoldStep, RegionId, Stretch } from '../types/stretch'
export function getStretch(id: string): Stretch {
  const stretch = stretches.find(item => item.id === id)
  if (!stretch) throw new Error(`Unknown stretch: ${id}`)
  return stretch
}
export const stretchesForRegion = (region: RegionId) => stretches.filter(stretch => stretch.primaryRegions.includes(region))
export const fullBodySequence = (): Stretch[] => fullBodyIds.map(getStretch)
export function holdSequence(stretch: Pick<Stretch, 'unilateral' | 'defaultSets' | 'defaultHoldSeconds'>): HoldStep[] {
  return Array.from({ length: stretch.defaultSets }, (_, index) => {
    const sides: HoldStep['side'][] = stretch.unilateral ? ['left', 'right'] : [null]
    return sides.map(side => ({ set: index + 1, side, seconds: stretch.defaultHoldSeconds }))
  }).flat()
}
export function isStretchComplete(stretch: Stretch, results: HoldResult[] = []): boolean {
  const sequence = holdSequence(stretch)
  return sequence.length === results.length && sequence.every((step, index) => {
    const result = results[index]
    return result.status === 'completed' && result.step.set === step.set && result.step.side === step.side && result.heldMs >= step.seconds * 1000
  })
}
export function completedRegions(results: Record<string, HoldResult[]>): Set<RegionId> {
  return new Set(stretches.filter(stretch => isStretchComplete(stretch, results[stretch.id])).flatMap(stretch => stretch.primaryRegions))
}
export const plannedHoldSeconds = (routine: readonly Stretch[]) => routine.reduce((sum, stretch) => sum + holdSequence(stretch).reduce((seconds, step) => seconds + step.seconds, 0), 0)
export const actualHoldSeconds = (results: Record<string, HoldResult[]>) => Math.floor(Object.values(results).flat().reduce((sum, result) => sum + result.heldMs, 0) / 1000)
// Wall-clock deadline is authoritative; the interval only refreshes the display.
export function remainingMs(deadline: number, now: number): number { return Math.max(0, deadline - now) }
export const clockText = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0')}:${Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0')}`
export const prescription = (stretch: Stretch) => `${stretch.defaultHoldSeconds} sec × ${stretch.defaultSets}${stretch.unilateral ? ' / side' : ' sets'}`
