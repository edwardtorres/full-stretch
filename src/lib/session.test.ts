import { expect, it } from 'vitest'
import { createSession, sessionReducer } from './session'
import { fullBodyIds } from '../data/stretches'
import { actualHoldSeconds, completedRegions, holdSequence, getStretch } from './stretch'
it('starts, pauses and resumes without counting paused time', () => {
  let state = createSession(['supine-hamstring-stretch'], 'targeted')
  state = sessionReducer(state, { type: 'START', now: 1000 })
  state = sessionReducer(state, { type: 'PAUSE', now: 11000 })
  expect(state.remaining).toBe(20000)
  state = sessionReducer(state, { type: 'RESUME', now: 90000 })
  expect(state.deadline).toBe(110000)
  state = sessionReducer(state, { type: 'TICK', now: 130000 })
  expect(state.phase).toBe('transition')
  expect(state.holdIndex).toBe(0)
  expect(state.results['supine-hamstring-stretch'][0].heldMs).toBe(30000)
  state = sessionReducer(state, { type: 'TICK', now: 160000 })
  expect(state.results['supine-hamstring-stretch']).toHaveLength(1)
  state = sessionReducer(state, { type: 'NEXT_HOLD' })
  expect(state.phase).toBe('ready')
  expect(holdSequence(getStretch(state.ids[0]))[state.holdIndex].side).toBe('right')
})
it('completes a hold if pause arrives after the deadline', () => {
  const state = sessionReducer(sessionReducer(createSession(['butterfly-stretch'], 'targeted'), { type: 'START', now: 0 }), { type: 'PAUSE', now: 40000 })
  expect(state.phase).toBe('transition')
})
it('requires explicit progression and completes a full routine accurately', () => {
  let state = createSession([...fullBodyIds], 'full-body')
  for (const id of fullBodyIds) {
    for (const _step of holdSequence(getStretch(id))) {
      state = sessionReducer(state, { type: 'START', now: 1000 })
      state = sessionReducer(state, { type: 'TICK', now: 40000 })
      if (state.phase === 'transition') state = sessionReducer(state, { type: 'NEXT_HOLD' })
    }
    expect(state.phase).toBe('stretch-complete')
    state = sessionReducer(state, { type: 'NEXT_STRETCH' })
  }
  expect(state.phase).toBe('complete')
  expect(completedRegions(state.results).size).toBe(11)
  expect(actualHoldSeconds(state.results)).toBe(1260)
})
it('tracks a skip without rewarding completion', () => {
  let state = createSession(['butterfly-stretch'], 'targeted')
  state = sessionReducer(state, { type: 'START', now: 0 })
  state = sessionReducer(state, { type: 'SKIP', now: 5000 })
  expect(state.results['butterfly-stretch'][0]).toMatchObject({ status: 'skipped', heldMs: 5000 })
  state = sessionReducer(state, { type: 'NEXT_HOLD' })
  state = sessionReducer(state, { type: 'SKIP', now: 10000 })
  state = sessionReducer(state, { type: 'NEXT_STRETCH' })
  expect(state.phase).toBe('complete')
  expect(completedRegions(state.results).size).toBe(0)
})
it('ignores duplicate and out-of-order controls', () => {
  const ready = createSession(['butterfly-stretch'], 'targeted')
  expect(sessionReducer(ready, { type: 'NEXT_STRETCH' })).toBe(ready)
  const holding = sessionReducer(ready, { type: 'START', now: 0 })
  expect(sessionReducer(holding, { type: 'START', now: 5000 })).toBe(holding)
})
