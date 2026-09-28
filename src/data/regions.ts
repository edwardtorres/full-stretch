import type { RegionId, BodyView } from '../types/stretch'
export const regions: Record<RegionId, { label: string; shortLabel?: string; view: BodyView }> = {
  chest: { label: 'Chest', view: 'front' },
  shoulders: { label: 'Shoulders', view: 'front' },
  biceps: { label: 'Biceps', view: 'front' },
  triceps: { label: 'Triceps', view: 'back' },
  'upper-back': { label: 'Upper Back', view: 'back' },
  lats: { label: 'Lats', view: 'back' },
  abs: { label: 'Abs / Front Trunk', shortLabel: 'Front Trunk', view: 'front' },
  'hip-flexors': { label: 'Hip Flexors', view: 'front' },
  glutes: { label: 'Glutes', view: 'back' },
  adductors: { label: 'Adductors / Inner Thigh', shortLabel: 'Inner Thigh', view: 'front' },
  quadriceps: { label: 'Quadriceps', view: 'front' },
  hamstrings: { label: 'Hamstrings', view: 'back' },
  calves: { label: 'Calves', view: 'back' },
}
export const regionGroups: { label: string; ids: RegionId[] }[] = [
  { label: 'Upper body', ids: ['chest', 'shoulders', 'biceps', 'triceps', 'upper-back', 'lats', 'abs'] },
  { label: 'Lower body', ids: ['hip-flexors', 'glutes', 'adductors', 'quadriceps', 'hamstrings', 'calves'] },
]
