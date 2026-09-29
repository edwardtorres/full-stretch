import { fullBodyIds } from './stretches'
import type { StretchProgram } from '../types/program'
// Standing → kneeling → floor. Tier names are not exact duration promises.
export const programs: readonly StretchProgram[] = [
  {
    id: 'quick-5', name: 'Quick 5', purpose: 'For a short stretch session.',
    description: 'Five selected regions, with upper and lower body work. A short routine, not comprehensive body coverage.',
    stretchIds: ['cross-body-shoulder-stretch', '90-degree-lat-stretch', 'straight-knee-wall-calf-stretch', 'supine-hamstring-stretch', 'butterfly-stretch'],
  },
  {
    id: 'daily-10', name: 'Daily 10', purpose: 'For regular flexibility work.',
    description: 'Eight movements balancing upper body, hips, legs and trunk. Move from standing to kneeling, then settle onto the floor.',
    stretchIds: ['cross-body-shoulder-stretch', '90-degree-lat-stretch', 'straight-knee-wall-calf-stretch', 'half-kneeling-hip-flexor-stretch', 'childs-pose-reach', 'supine-hamstring-stretch', 'butterfly-stretch', 'gentle-cobra-stretch'],
  },
  {
    id: 'full-20', name: 'Full 20', purpose: 'For comprehensive coverage.',
    description: 'The original twelve-stretch routine, including both calf variations. Eleven primary regions, from standing through floor work.',
    stretchIds: [...fullBodyIds],
  },
]
