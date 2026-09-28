import { describe, expect, it } from 'vitest'
import { stretches, fullBodyIds } from '../data/stretches'
import { regionIds } from '../types/stretch'
import { actualHoldSeconds, completedRegions, fullBodySequence, getStretch, holdSequence, isStretchComplete, plannedHoldSeconds, remainingMs, stretchesForRegion } from './stretch'
const hamstring = getStretch('supine-hamstring-stretch')
const results = holdSequence(hamstring).map(step => ({ step, status: 'completed' as const, heldMs: step.seconds * 1000 }))
describe('stretch library and prescriptions', () => {
  it.each(regionIds)('%s has a primary stretch', region => expect(stretchesForRegion(region).length).toBeGreaterThan(0))
  it('has unique stable stretch IDs', () => {
    expect(new Set(stretches.map(s => s.id)).size).toBe(stretches.length)
    stretches.forEach(s => expect(s.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
  })
  it('has valid hold durations, sets, cues and region IDs', () => stretches.forEach(s => {
    expect(s.defaultHoldSeconds).toBeGreaterThan(0)
    expect(s.defaultHoldSeconds).toBe(30)
    expect(s.defaultSets).toBe(2)
    expect(s.setupCues.length).toBeGreaterThan(0)
    expect(s.stretchCues.length).toBeGreaterThan(0)
    expect(s.safetyCue.length).toBeGreaterThan(0)
    ;[...s.primaryRegions, ...(s.secondaryRegions ?? [])].forEach(r => expect(regionIds).toContain(r))
  }))
  it('generates explicit left/right order for each set', () => expect(holdSequence(hamstring)).toEqual([
    { set: 1, side: 'left', seconds: 30 }, { set: 1, side: 'right', seconds: 30 },
    { set: 2, side: 'left', seconds: 30 }, { set: 2, side: 'right', seconds: 30 },
  ]))
  it('generates two non-side-specific holds', () => expect(holdSequence(getStretch('butterfly-stretch'))).toEqual([
    { set: 1, side: null, seconds: 30 }, { set: 2, side: null, seconds: 30 },
  ]))
  it('marks primary regions when every hold is complete', () => expect([...completedRegions({ [hamstring.id]: results })]).toEqual(['hamstrings']))
  it('does not mark an incomplete stretch', () => expect(completedRegions({ [hamstring.id]: results.slice(0, 3) }).size).toBe(0))
  it('does not count skipped holds as completed', () => expect(isStretchComplete(hamstring, [{ ...results[0], status: 'skipped', heldMs: 4000 }, ...results.slice(1)])).toBe(false))
  it('does not mark secondary regions', () => {
    const stretch = getStretch('90-degree-lat-stretch')
    const holds = holdSequence(stretch).map(step => ({ step, status: 'completed' as const, heldMs: 30000 }))
    expect([...completedRegions({ [stretch.id]: holds })]).toEqual(['lats'])
  })
  it('requires the prescribed side order', () => expect(isStretchComplete(hamstring, [...results].reverse())).toBe(false))
  it('has a valid deterministic full-body routine', () => { expect(fullBodySequence()).toHaveLength(12); fullBodyIds.forEach(id => expect(getStretch(id)).toBeDefined()) })
  it('has no duplicate full-body IDs', () => expect(new Set(fullBodyIds).size).toBe(fullBodyIds.length))
  it('calculates planned total hold time', () => { expect(plannedHoldSeconds([hamstring])).toBe(120); expect(plannedHoldSeconds(fullBodySequence())).toBe(1260) })
  it('calculates actual time including partially skipped holds', () => expect(actualHoldSeconds({ [hamstring.id]: [...results.slice(0, 2), { ...results[2], status: 'skipped', heldMs: 5000 }] })).toBe(65))
})
describe('deadline timing', () => {
  it('uses wall-clock timestamps', () => expect(remainingMs(31000, 11000)).toBe(20000))
  it('catches up after a background-tab gap', () => expect(remainingMs(31000, 48000)).toBe(0))
  it('never becomes negative', () => expect(remainingMs(1000, 5000)).toBe(0))
})
