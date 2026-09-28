import { afterAll, beforeAll, expect, it } from 'vitest'
import { localDayKey, sameLocalDay } from './dates'
const previousTimezone = process.env.TZ
beforeAll(() => { process.env.TZ = 'America/Los_Angeles' })
afterAll(() => { process.env.TZ = previousTimezone })
it('builds a local calendar key without parsing a date through UTC', () => expect(localDayKey(new Date(2026,8,27,0,5))).toBe('2026-09-27'))
it('handles an ISO instant that belongs to the previous local day', () => expect(localDayKey('2026-09-27T01:00:00.000Z')).toBe('2026-09-26'))
it('filters today by local day, not UTC date', () => {
  const today=new Date(2026,8,27,12)
  expect(sameLocalDay('2026-09-27T01:00:00.000Z',today)).toBe(false)
  expect(sameLocalDay('2026-09-28T01:00:00.000Z',today)).toBe(true)
})
it('handles local daylight saving boundaries', () => {
  expect(localDayKey('2026-11-01T08:30:00.000Z')).toBe('2026-11-01')
  expect(localDayKey('2026-11-01T09:30:00.000Z')).toBe('2026-11-01')
})
