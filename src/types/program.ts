export const programIds = ['quick-5', 'daily-10', 'full-20'] as const
export type ProgramId = typeof programIds[number]
export interface StretchProgram {
  id: ProgramId
  name: string
  purpose: string
  description: string
  stretchIds: readonly string[]
}
