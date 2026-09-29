import { regionIds } from '../../types/stretch'
import { regions } from '../../data/regions'
import type { RegionId } from '../../types/stretch'
export function MobilityRegionMap({ current, moved, included }: { current: ReadonlySet<RegionId>; moved: ReadonlySet<RegionId>; included: ReadonlySet<RegionId> }) {
  return <section className="mobility-region-map" aria-label="Mobility body regions"><div className="mobility-region-heading"><span className="mini-label">Movement map</span><p>Amber: current · Green: moved</p></div><ul>{regionIds.map(id => <li key={id} className={current.has(id) ? 'is-current' : moved.has(id) ? 'is-moved' : ''}><span>{regions[id].label}</span><small>{current.has(id) ? 'Current movement' : moved.has(id) ? 'Moved' : included.has(id) ? 'Upcoming movement' : 'Not in this warm-up'}</small></li>)}</ul><p className="mobility-map-note">Moved means dynamic activity, not a completed static stretch.</p></section>
}
