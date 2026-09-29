import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import type { BodyView, RegionId } from '../types/stretch'
import { regions } from '../data/regions'
const AnatomyScene = lazy(() => import('./anatomy/AnatomyScene'))
class BodyErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="body-fallback">Body map unavailable.<span>Choose a region from the text buttons.</span></div> : this.props.children }
}
export function BodyMap({ view, setView, selected, completed, coverageTones, onSelect, interactive = true, coverageLabel = 'Completed' }: {
  view: BodyView; setView: (view: BodyView) => void; selected: RegionId | null; completed: ReadonlySet<RegionId>; coverageTones?: ReadonlyMap<RegionId, 'well' | 'less' | 'building'>; onSelect: (id: RegionId) => void; interactive?: boolean; coverageLabel?: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect() } }, { rootMargin: '120px' })
    if (container.current) observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  return <section className="body-map" aria-label="Stretch body map">
    <div className="anatomy-stage" ref={container}>
      <div className="anatomy-halo" aria-hidden="true" />
      <div className="anatomy-canvas"><BodyErrorBoundary><Suspense fallback={<div className="body-fallback">Loading body map</div>}>
        {visible ? <AnatomyScene view={view} selected={selected} completed={completed} coverageTones={coverageTones} onSelect={onSelect} interactive={interactive} /> : <div className="body-fallback">Loading body map</div>}
      </Suspense></BodyErrorBoundary></div>
      <div className="stage-annotation"><span className="mini-label">{selected ? 'Selected region' : 'Body map'}</span><strong>{selected ? regions[selected].shortLabel ?? regions[selected].label : 'Find your focus.'}</strong>
        {selected && (coverageTones ? <span className="completed-label">{coverageTones.get(selected) === 'well' ? 'Well Covered' : coverageTones.get(selected) === 'less' ? 'Less Covered' : 'Building Data'}</span> : completed.has(selected) && <span className="completed-label"><Check size={13} /> Complete</span>)}
        <span className="annotation-line" aria-hidden="true" />
      </div>
      <span className="view-label mini-label">{view === 'front' ? 'Anterior' : 'Posterior'}</span>
    </div>
    <div className="body-controls"><div className="view-buttons" role="group" aria-label="Body view">
      <button type="button" aria-pressed={view === 'front'} onClick={() => setView('front')}>Front</button>
      <button type="button" aria-pressed={view === 'back'} onClick={() => setView('back')}>Back <RotateCcw size={13} aria-hidden="true" /></button>
    </div></div><div className="map-legend" aria-label={coverageLabel}>{(coverageTones ? ['Well Covered', 'Less Covered', 'Building Data'] : ['Selected', 'Completed', 'Not completed']).map((label, index) => <span key={label} className={`legend-state legend-${coverageTones ? 'coverage' : 'today'}-${index}`}><i aria-hidden="true" />{label}</span>)}</div><div className="sr-only">{coverageLabel}</div>
  </section>
}
