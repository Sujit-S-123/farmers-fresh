import { asset } from '../../api'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorBox, useTitle } from '../../components/ui'
import { homeFor, useAuth } from '../../context/AuthContext'
import { DISTRICTS } from '../../utils'

// Client-side checks (the PHP backend checks again)
function validate(f) {
  if (f.name.trim().length < 2) return 'Please enter your full name.'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'Please enter a valid email address.'
  if (!/^[6-9]\d{9}$/.test(f.phone)) return 'Please enter a valid 10-digit mobile number.'
  if (!f.district) return 'Please select your district.'
  if (f.role === 'farmer' && f.farm_name.trim().length < 2) return 'Please enter your farm name.'
  if (f.password.length < 6) return 'Password must be at least 6 characters.'
  if (f.password !== f.confirm) return 'The two passwords do not match.'
  return ''
}

export default function Register() {
  useTitle('Create account')
  const [params] = useSearchParams()
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    role: params.get('role') === 'farmer' ? 'farmer' : 'consumer',
    name: '', email: '', phone: '', district: '', village: '', farm_name: '', address: '', password: '', confirm: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const farmer = form.role === 'farmer'

  if (user) return <Navigate to={homeFor(user)} replace />

  const submit = async (e) => {
    e.preventDefault()
    const msg = validate(form)
    if (msg) return setError(msg)
    setError('')
    setBusy(true)
    try {
      const u = await register(form)
      navigate(u.role === 'farmer' ? '/pending-approval' : '/shop', { replace: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="ff-auth">
      <div className="container">
        <div className="ff-card ff-auth-card">
          <div className="row g-0">
            <div className="col-lg-5 d-none d-lg-block">
              <div className="ff-auth-side">
                <span className="small-caps text-terracotta">{farmer ? 'For farmers' : 'For families'}</span>
                <h2 className="mt-2">{farmer ? 'Sell your harvest directly' : 'Fresh food, fair prices'}</h2>
                <p className="text-muted mb-0">
                  {farmer
                    ? 'List your produce with ready-made photos, set your own price and receive orders from nearby buyers.'
                    : 'Order vegetables, fruits and grains straight from the farmers who grow them.'}
                </p>
                <img src={asset('images/hero-farm.svg')} alt="" />
              </div>
            </div>
            <div className="col-lg-7">
              <form className="ff-auth-form" onSubmit={submit} noValidate>
                <h3 className="mb-1">Create your account</h3>
                <p className="text-muted mb-4">Already registered? <Link to="/login" className="fw-bold">Log in</Link></p>

                <div className="row g-3 mb-4">
                  {[
                    { v: 'consumer', icon: 'basket2', t: "I'm buying", s: 'Order fresh produce' },
                    { v: 'farmer', icon: 'flower1', t: "I'm a farmer", s: 'Sell my harvest' },
                  ].map((r) => (
                    <div className="col-6" key={r.v}>
                      <div className={`ff-role-pick ${form.role === r.v ? 'active' : ''}`} role="button" tabIndex={0}
                        onClick={() => setForm({ ...form, role: r.v })} onKeyDown={(e) => e.key === 'Enter' && setForm({ ...form, role: r.v })}>
                        <i className={`bi bi-${r.icon}`} />
                        <div className="fw-bold mt-1">{r.t}</div>
                        <div className="small text-muted">{r.s}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <ErrorBox error={error} />
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="r-name">Full name</label>
                    <input id="r-name" className="form-control" value={form.name} onChange={set('name')} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="r-phone">Mobile number</label>
                    <input id="r-phone" className="form-control" inputMode="numeric" maxLength="10" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="r-email">Email</label>
                    <input id="r-email" type="email" className="form-control" value={form.email} onChange={set('email')} />
                  </div>
                  {farmer && (
                    <div className="col-12">
                      <label className="form-label" htmlFor="r-farm">Farm name</label>
                      <input id="r-farm" className="form-control" placeholder="e.g. Green Valley Farms" value={form.farm_name} onChange={set('farm_name')} />
                    </div>
                  )}
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="r-district">District</label>
                    <select id="r-district" className="form-select" value={form.district} onChange={set('district')}>
                      <option value="">Select district</option>
                      {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="r-village">{farmer ? 'Village' : 'Area'} <span className="text-muted fw-normal">(optional)</span></label>
                    <input id="r-village" className="form-control" value={farmer ? form.village : form.address} onChange={farmer ? set('village') : set('address')} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="r-pass">Password</label>
                    <input id="r-pass" type="password" className="form-control" autoComplete="new-password" value={form.password} onChange={set('password')} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="r-confirm">Confirm password</label>
                    <input id="r-confirm" type="password" className="form-control" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
                  </div>
                </div>
                {farmer && <div className="alert alert-warm small mt-3 mb-0"><i className="bi bi-hourglass-split me-1" /> New farm accounts are checked by our team before you can start selling.</div>}
                <button className="btn btn-primary w-100 btn-lg mt-4" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
