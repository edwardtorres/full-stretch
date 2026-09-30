import { Component } from 'react'
import type { ReactNode } from 'react'

/** Last-resort render recovery; repository notices remain inside the app. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <main className="release-recovery" aria-labelledby="recovery-heading">
      <p className="eyebrow">Full Stretch</p>
      <h1 id="recovery-heading">Something went wrong.</h1>
      <button className="primary-button" onClick={() => window.location.reload()}>Reload app</button>
    </main>
  }
}
