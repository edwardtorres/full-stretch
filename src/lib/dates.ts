export function localDayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const sameLocalDay = (instant: string, today = new Date()) => localDayKey(instant) === localDayKey(today)
export const displayDate = (instant: string) => new Date(instant).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
export const displayDateTime = (instant: string) => new Date(instant).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
