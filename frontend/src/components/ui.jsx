// Small reusable UI pieces
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dayKey, rupees } from '../utils'

export function Loader() {
  return <div className="ff-loader"><div className="spinner-border" role="status"><span className="visually-hidden">Loading…</span></div></div>
}

export function EmptyState({ icon = 'basket', title, text, action }) {
  return (
    <div className="ff-empty">
      <div className="ff-empty-icon"><i className={`bi bi-${icon}`} /></div>
      <h4>{title}</h4>
      {text && <p className="text-muted mb-4 mx-auto" style={{ maxWidth: 420 }}>{text}</p>}
      {action}
    </div>
  )
}

export function ErrorBox({ error }) {
  if (!error) return null
  return <div className="alert alert-danger d-flex gap-2 align-items-start"><i className="bi bi-exclamation-circle mt-1" /><div>{error}</div></div>
}

export function StatusBadge({ status }) {
  return <span className={`ff-badge st-${status}`}>{status}</span>
}

export function Stars({ value, count }) {
  const v = Math.round(Number(value) || 0)
  return (
    <span className="ff-stars" title={value ? `${value} out of 5` : 'No ratings yet'}>
      {'★'.repeat(v)}<span style={{ color: '#e8d6b6' }}>{'★'.repeat(5 - v)}</span>
      {count !== undefined && <span className="text-muted ms-1" style={{ fontSize: '.8rem', letterSpacing: 0 }}>({count})</span>}
    </span>
  )
}

export function QtyInput({ value, onChange, max, small }) {
  return (
    <div className={`ff-qty ${small ? 'ff-qty-sm' : ''}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease">−</button>
      <input
        type="number" min="1" max={max} value={value} aria-label="Quantity"
        onChange={(e) => onChange(Math.max(1, Math.min(max, parseInt(e.target.value) || 1)))}
      />
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase">+</button>
    </div>
  )
}

export function StatCard({ icon, tone = 'terracotta', label, value, to }) {
  const inner = (
    <div className="ff-card ff-stat">
      <div className={`ff-stat-icon tone-${tone}`}><i className={`bi bi-${icon}`} /></div>
      <div>
        <div className="ff-stat-value">{value}</div>
        <div className="ff-stat-label">{label}</div>
      </div>
    </div>
  )
  return to ? <Link to={to} className="text-reset d-block h-100">{inner}</Link> : inner
}

// Vertical bars for the last 7 days
export function WeekBars({ rows, valueKey = 'total', money = true }) {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = dayKey(d)
    const row = rows.find((r) => r.day === key)
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), value: Number(row?.[valueKey] || 0) }
  })
  const max = Math.max(1, ...days.map((d) => d.value))
  return (
    <div className="ff-bars">
      {days.map((d, i) => (
        <div className="ff-bar" key={i}>
          <span className="ff-bar-val">{d.value ? (money ? rupees(d.value) : d.value) : ''}</span>
          <div className={`ff-bar-fill ${d.value ? '' : 'muted'}`} style={{ height: `${(d.value / max) * 140}px` }} />
          <span className="ff-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// Horizontal bar; width is a fraction 0–1
export function HBar({ label, value, width, color = 'var(--ff-terracotta)' }) {
  return (
    <div className="ff-hbar">
      <div className="d-flex justify-content-between gap-2 small fw-bold"><span>{label}</span><span>{value}</span></div>
      <div className="ff-hbar-track"><div className="ff-hbar-fill" style={{ width: `${Math.max(2, (width || 0) * 100)}%`, background: color }} /></div>
    </div>
  )
}

// Fetch helper: const { data, loading, error, reload } = useApi(() => api.get(...), [deps])
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: s.data === null, error: '' }))
    return run()
      .then((data) => setState({ data, loading: false, error: '' }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }))
  }, [run])
  useEffect(() => { reload() }, [reload])
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) }
}

export function useTitle(title) {
  useEffect(() => { document.title = title ? `${title} · Farmer's Fresh` : "Farmer's Fresh" }, [title])
}
