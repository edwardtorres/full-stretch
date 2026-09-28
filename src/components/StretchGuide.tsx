import type { Stretch } from '../types/stretch'
type Point = [number, number]
interface Pose { head: Point; shoulder: Point; hip: Point; elbows: [Point, Point]; hands: [Point, Point]; knees: [Point, Point]; feet: [Point, Point] }
const standing: Pose = { head: [80, 26], shoulder: [80, 51], hip: [80, 105], elbows: [[59, 76], [101, 76]], hands: [[54, 105], [106, 105]], knees: [[68, 136], [92, 136]], feet: [[62, 166], [98, 166]] }
const floor: Pose = { head: [24, 145], shoulder: [45, 148], hip: [95, 148], elbows: [[64, 131], [62, 146]], hands: [[82, 120], [85, 146]], knees: [[124, 149], [119, 123]], feet: [[157, 151], [148, 149]] }
const posed = (base: Pose, change: Partial<Pose>): Pose => ({ ...base, ...change })
const poses: Record<string, [Pose, Pose]> = {
  'doorway-chest-stretch': [posed(standing, { elbows: [[48, 55], [101, 76]], hands: [[48, 24], [106, 105]] }), posed(standing, { shoulder: [87, 53], hip: [88, 107], elbows: [[48, 55], [108, 80]], hands: [[48, 24], [111, 108]] })],
  'cross-body-shoulder-stretch': [standing, posed(standing, { elbows: [[96, 58], [75, 74]], hands: [[115, 62], [88, 54]] })],
  'overhead-triceps-stretch': [posed(standing, { elbows: [[65, 24], [101, 76]], hands: [[63, 4], [106, 105]] }), posed(standing, { elbows: [[65, 9], [105, 34]], hands: [[85, 43], [66, 15]] })],
  '90-degree-lat-stretch': [standing, { head: [102, 72], shoulder: [85, 76], hip: [51, 107], elbows: [[118, 73], [116, 81]], hands: [[145, 76], [145, 83]], knees: [[49, 137], [66, 139]], feet: [[43, 166], [70, 166]] }],
  'standing-quadriceps-stretch': [standing, posed(standing, { elbows: [[52, 72], [103, 90]], hands: [[37, 67], [113, 122]], knees: [[73, 137], [97, 141]], feet: [[69, 166], [113, 120]] })],
  'straight-knee-wall-calf-stretch': [standing, { head: [103, 31], shoulder: [94, 54], hip: [78, 105], elbows: [[122, 56], [123, 63]], hands: [[145, 56], [145, 63]], knees: [[109, 130], [53, 135]], feet: [[115, 166], [24, 166]] }],
  'bent-knee-wall-calf-stretch': [standing, { head: [103, 39], shoulder: [94, 62], hip: [78, 110], elbows: [[122, 59], [123, 66]], hands: [[145, 59], [145, 66]], knees: [[109, 136], [66, 144]], feet: [[115, 166], [43, 166]] }],
  'half-kneeling-hip-flexor-stretch': [{ head: [74, 31], shoulder: [74, 54], hip: [74, 112], elbows: [[61, 83], [102, 83]], hands: [[56, 111], [116, 119]], knees: [[56, 155], [116, 122]], feet: [[28, 164], [117, 164]] }, { head: [86, 31], shoulder: [86, 54], hip: [86, 112], elbows: [[73, 83], [114, 83]], hands: [[68, 111], [125, 119]], knees: [[56, 155], [125, 122]], feet: [[28, 164], [126, 164]] }],
  'supine-hamstring-stretch': [floor, posed(floor, { elbows: [[72, 122], [74, 130]], hands: [[105, 107], [108, 113]], knees: [[117, 107], [124, 150]], feet: [[130, 72], [157, 151]] })],
  'supine-figure-four-stretch': [floor, posed(floor, { elbows: [[70, 121], [72, 132]], hands: [[108, 104], [110, 110]], knees: [[109, 102], [125, 114]], feet: [[137, 127], [101, 103]] })],
  'butterfly-stretch': [{ ...standing, head: [80, 69], shoulder: [80, 92], hip: [80, 143], elbows: [[56, 118], [104, 118]], hands: [[60, 151], [100, 151]], knees: [[49, 145], [111, 145]], feet: [[77, 162], [83, 162]] }, { ...standing, head: [80, 69], shoulder: [80, 92], hip: [80, 143], elbows: [[61, 121], [99, 121]], hands: [[77, 158], [83, 158]], knees: [[40, 152], [120, 152]], feet: [[77, 162], [83, 162]] }],
  'gentle-cobra-stretch': [posed(floor, { head: [24, 145], shoulder: [45, 148], elbows: [[42, 162], [50, 162]], hands: [[28, 167], [43, 167]], knees: [[124, 149], [124, 151]], feet: [[157, 151], [158, 153]] }), posed(floor, { head: [30, 102], shoulder: [48, 126], elbows: [[36, 149], [49, 150]], hands: [[29, 167], [43, 167]], knees: [[124, 149], [124, 151]], feet: [[157, 151], [158, 153]] })],
  'childs-pose-reach': [{ head: [96, 69], shoulder: [85, 93], hip: [77, 141], elbows: [[100, 116], [95, 123]], hands: [[109, 148], [104, 152]], knees: [[52, 160], [58, 164]], feet: [[92, 163], [97, 168]] }, { head: [76, 146], shoulder: [82, 131], hip: [117, 153], elbows: [[56, 149], [62, 155]], hands: [[26, 161], [32, 168]], knees: [[89, 166], [95, 170]], feet: [[136, 166], [141, 170]] }],
  'supported-biceps-stretch': [{ ...standing, head: [80, 47], shoulder: [80, 72], hip: [80, 119], elbows: [[61, 93], [99, 94]], hands: [[49, 117], [115, 116]], knees: [[119, 120], [111, 128]], feet: [[117, 166], [110, 170]] }, { ...standing, head: [72, 47], shoulder: [72, 72], hip: [72, 119], elbows: [[49, 95], [104, 98]], hands: [[37, 117], [126, 116]], knees: [[111, 120], [103, 128]], feet: [[109, 166], [102, 170]] }],
}
function Figure({ pose, id, label }: { pose: Pose; id: string; label: string }) {
  const line = (a: Point, b: Point, key: string) => <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
  return <svg viewBox="0 0 180 184" role="img" aria-label={label}>
    <path d="M12 174H168" className="guide-ground" />
    {id.includes('wall-calf') && <path d="M149 23V174" className="guide-prop" />}
    {id === 'doorway-chest-stretch' && <path d="M45 14V170" className="guide-prop" />}
    {id === '90-degree-lat-stretch' && <path d="M142 86H172V172" className="guide-prop" />}
    {id === 'supported-biceps-stretch' && <path d="M40 126H135V170M45 126V170" className="guide-prop" />}
    <g className="guide-limbs">{line(pose.hip, pose.knees[0], 'l1')}{line(pose.knees[0], pose.feet[0], 'l2')}{line(pose.hip, pose.knees[1], 'r1')}{line(pose.knees[1], pose.feet[1], 'r2')}</g>
    <g className="guide-spine">{line(pose.shoulder, pose.hip, 'spine')}</g>
    <g className="guide-limbs">{line(pose.shoulder, pose.elbows[0], 'a1')}{line(pose.elbows[0], pose.hands[0], 'a2')}{line(pose.shoulder, pose.elbows[1], 'b1')}{line(pose.elbows[1], pose.hands[1], 'b2')}</g>
    <circle cx={pose.head[0]} cy={pose.head[1]} r="12" className="guide-head" />
  </svg>
}
export function StretchGuide({ stretch }: { stretch: Stretch }) {
  const pair = poses[stretch.id]
  return <div className="stretch-guide">
    {pair && <div className="guide-frames">{pair.map((pose, index) => <figure key={index}><Figure pose={pose} id={stretch.id} label={`${stretch.name}: ${index === 0 ? 'set up' : 'hold'} position diagram`} /><figcaption>{index === 0 ? 'Set up' : 'Hold'}</figcaption></figure>)}<span aria-hidden="true" className="guide-arrow">→</span></div>}
    <div className="guide-cues"><div><h3>Set up</h3>{stretch.setupCues.map(cue => <p key={cue}>{cue}</p>)}</div><div><h3>Stretch</h3>{stretch.stretchCues.map(cue => <p key={cue}>{cue}</p>)}</div></div>
    <p className="safety-cue">{stretch.safetyCue} Do not force the position or push through sharp pain.</p>
  </div>
}
