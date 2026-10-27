import { DEMO, asset } from '../../api'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBox, useTitle } from '../../components/ui'
import { homeFor, useAuth } from '../../context/AuthContext'

const IS_DEMO = DEMO
const DEMO_ACCOUNTS = [
  { label: 'Consumer', email: 'priya@farmersfresh.in', password: 'consumer123' },
  { label: 'Farmer', email: 'murugan@farmersfresh.in', password: 'farmer123' },
  { label: 'Admin', email: 'admin@farmersfresh.in', password: 'admin123' },
]

export default function Login() {
  useTitle('Log in')
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor(user)} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) return setError('Please enter your email and password.')
    setBusy(true)
    try {
      const u = await login(form.email, form.password)
      const from = location.state?.from
      navigate(u.role === 'consumer' && from ? from : homeFor(u), { replace: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="ff-auth">
      <div className="container">
        <div className="ff-card ff-auth-card">
          <div className="row g-0">
            <div className="col-md-5 d-none d-md-block">
              <div className="ff-auth-side">
                <span className="small-caps text-terracotta">Welcome back</span>
                <h2 className="mt-2">Good to see you again</h2>
                <p className="text-muted mb-0">Log in to order fresh produce, manage your farm or run the marketplace.</p>
                <img src={asset('images/hero-farm.svg')} alt="" />
              </div>
            </div>
            <div className="col-md-7">
              <form className="ff-auth-form" onSubmit={submit} noValidate>
                <h3 className="mb-1">Log in</h3>
                <p className="text-muted mb-4">New here? <Link to="/register" className="fw-bold">Create an account</Link></p>
                <ErrorBox error={error} />
                <div className="mb-3">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input id="email" type="email" className="form-control" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="password">Password</label>
                  <div className="input-group">
                    <input id="password" type={show ? 'text' : 'password'} className="form-control" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <button type="button" className="input-group-text" onClick={() => setShow(!show)} aria-label="Show password"><i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} /></button>
                  </div>
                </div>
                <button className="btn btn-primary w-100 btn-lg" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>

                <div className="ff-demo mt-4">
                  <div className="fw-bold mb-2"><i className="bi bi-info-circle me-1" /> Demo accounts</div>
                  <div className="d-flex flex-wrap gap-2">
                    {DEMO_ACCOUNTS.map((d) => (
                      <button type="button" key={d.label} className="btn btn-soft btn-sm" onClick={() => setForm({ email: d.email, password: d.password })}>
                        Use {d.label}
                      </button>
                    ))}
                  </div>
                  {IS_DEMO && (
                    <div className="small text-muted mt-2">
                      Demo mode: everything you do is saved in this browser only.{' '}
                      <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={async () => { (await import('../../demo/mockApi')).resetDemo(); window.location.reload() }}>Reset demo data</button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
