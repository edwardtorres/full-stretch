import { describe, expect, it } from 'vitest'
import { milestoneProgress, sessionEarnedEvents } from './presentation'
import { createProgramSession, createSession, sessionReducer } from './session'
import { historicalSession } from './history'
import { defaultProfile } from './profile'
import { createMobilitySession, mobilityReducer } from './mobility'
import { historicalMobilitySession } from './mobilityHistory'
const now = Date.parse('2026-09-29T16:00:00Z')
const flexState = sessionReducer(createSession(['doorway-chest-stretch'], 'targeted', { holdSeconds: 20, sets: 1 }, now, 'flex'), { type: 'FINISH_EARLY', now: now + 1000 })
const flex = historicalSession(flexState)!
const mob = historicalMobilitySession(mobilityReducer(createMobilitySession('upper-body-warmup', now, 'mob'), { type: 'FINISH_EARLY', now: now + 1000 }))!
describe('existing milestone presentation', () => {
  it('counts unique flexibility records and caps the denominator', () => { expect(milestoneProgress('ten-flexibility', [flex, flex], [], 0)).toBe('1 / 10'); expect(milestoneProgress('three-week-streak', [], [], 8)).toBe('3 / 3') })
  it('keeps mobility progress separate', () => { expect(milestoneProgress('ten-mobility', [flex], [mob, mob], 0)).toBe('1 / 10') })
  it('does not invent progress for all-region coverage or baseline', () => { expect(milestoneProgress('all-regions', [flex], [], 0)).toBeNull(); expect(milestoneProgress('baseline-retest', [], [], 0)).toBeNull() })
  it('shows only events earned by the current session', () => { expect(sessionEarnedEvents([flex], 'flex', [], [], new Date(now))).toEqual(['Milestone earned · First Stretch Session']); expect(sessionEarnedEvents([flex, {...flex, id: 'second'}], 'second', [], [], new Date(now))).toEqual([]) })
  it('does not claim an event when the session is absent', () => { expect(sessionEarnedEvents([], 'missing', [], [], new Date(now))).toEqual([]) })
  it('shows a newly completed recorded week without claiming it twice', () => {
    const time = new Date(2026, 8, 29, 9).getTime()
    const program = historicalSession(sessionReducer(createProgramSession('quick-5', { holdSeconds: 20, sets: 1 }, time, 'program'), { type: 'FINISH_EARLY', now: time + 1000 }))!
    const schedule = defaultProfile().profile.weeklySchedule.map(day => ({...day, programId: day.weekday === 'tuesday' ? 'quick-5' as const : null}))
    const weeks = [{weekStart: '2026-09-28', schedule}]
    expect(sessionEarnedEvents([program], 'program', [], weeks, new Date(time))).toContain('Complete Week · all scheduled flexibility sessions finished')
    expect(sessionEarnedEvents([program, {...program, id: 'repeat'}], 'repeat', [], weeks, new Date(time))).not.toContain('Complete Week · all scheduled flexibility sessions finished')
  })
  it('identifies a first mobility event independently', () => { expect(sessionEarnedEvents([flex, mob], 'mob', [], [], new Date(now))).toEqual(['Milestone earned · First Mobility Session']) })
})
