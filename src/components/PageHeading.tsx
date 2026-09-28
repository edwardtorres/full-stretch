import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
export function PageHeading({ title, eyebrow, onBack, backLabel = 'Back to body' }: { title: string; eyebrow: string; onBack: () => void; backLabel?: string }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0 }) }, [title])
  return <header className="page-heading"><button className="text-button" onClick={onBack}><ArrowLeft size={16} /> {backLabel}</button><p className="eyebrow">{eyebrow}</p><h1 ref={heading} tabIndex={-1}>{title}</h1></header>
}
