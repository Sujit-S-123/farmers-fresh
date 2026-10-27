import { Component } from 'react'

// If any page throws while rendering, show a friendly message instead of a blank screen
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Farmer\'s Fresh crashed:', error, info?.componentStack)
  }

  reset = async () => {
    if (import.meta.env.VITE_DEMO === '1' || import.meta.env.MODE === 'demo') {
      try { (await import('../demo/mockApi')).resetDemo() } catch { /* ignore */ }
      try { localStorage.removeItem('ff_cart') } catch { /* ignore */ }
    }
    window.location.hash = '#/'
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="container py-5">
        <div className="ff-card ff-card-pad mx-auto text-center" style={{ maxWidth: 560 }}>
          <div className="ff-empty-icon"><i className="bi bi-exclamation-triangle" /></div>
          <h3>Something went wrong on this page</h3>
          <p className="text-muted">Reloading usually fixes it. If it keeps happening, send this message to the developer:</p>
          <pre className="bg-sand rounded-3 p-3 small text-start" style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || this.state.error)}</pre>
          <div className="d-flex gap-2 justify-content-center">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
            <button className="btn btn-soft" onClick={this.reset}>Reset and go home</button>
          </div>
        </div>
      </div>
    )
  }
}
