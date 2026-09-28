import { useEffect, useRef } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
export type Destination = 'dashboard' | 'progress' | 'baseline' | 'settings'
export function Menu({ onClose, onNavigate }: { onClose: () => void; onNavigate: (destination: Destination) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current!
    el.showModal()
    return () => { if (el.open) el.close() }
  }, [])
  return <dialog ref={dialog} className="menu-dialog" aria-labelledby="menu-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === dialog.current) onClose() }}>
    <div className="menu-content"><div className="menu-top"><h2 id="menu-title">Full Stretch</h2><button className="icon-button" aria-label="Close menu" onClick={onClose}><X size={20} /></button></div>
      <nav aria-label="Main navigation">{(['dashboard', 'progress', 'baseline', 'settings'] as const).map(destination => <button className="menu-link" key={destination} onClick={() => onNavigate(destination)}>{destination[0].toUpperCase() + destination.slice(1)}<ArrowUpRight size={22} /></button>)}
        {['Programs', 'Mobility'].map(label => <div className="menu-upcoming" key={label}><span>{label}</span><span className="mini-label">Coming later</span></div>)}
      </nav><p className="menu-footer">A little space to move.</p>
    </div>
  </dialog>
}
