import { useState } from 'react'
import { api } from '../../api'
import { ErrorBox, useTitle } from '../../components/ui'
import { DashTitle } from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { DISTRICTS, dateShort, initials } from '../../utils'

// Profile page used by every role (consumer page, or inside the farmer dashboard)
export default function Profile({ inDashboard }) {
  useTitle('Profile')
  const { user, setUser } = useAuth()
  const toast = useToast()
  const farmer = user.role === 'farmer'
  const [form, setForm] = useState({
    name: user.name || '', phone: user.phone || '', district: user.district || '',
    village: user.village || '', address: user.address || '', farm_name: user.farm_name || '',
  })
  const [pw, setPw] = useState({ current: '', new: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const d = await api.post('auth', 'update_profile', form)
      setUser(d.user)
      toast('Profile saved')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const changePw = async (e) => {
    e.preventDefault()
    try {
      await api.post('auth', 'change_password', pw)
      setPw({ current: '', new: '' })
      toast('Password updated')
    } catch (err) { toast(err.message, 'error') }
  }

  const body = (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="ff-card ff-card-pad text-center">
          <span className={`avatar ${farmer ? 'olive' : ''}`} style={{ width: 80, height: 80, fontSize: '1.7rem' }}>{initials(user.name)}</span>
          <h4 className="mt-3 mb-0">{user.name}</h4>
          {farmer && <div className="fw-semibold text-olive">{user.farm_name}</div>}
          <div className="text-muted small">{user.email}</div>
          <div className="small text-muted mt-2">Member since {dateShort(user.created_at)}</div>
        </div>
        <form className="ff-card ff-card-pad mt-4" onSubmit={changePw}>
          <h6 className="mb-3">Change password</h6>
          <input type="password" className="form-control mb-2" placeholder="Current password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <input type="password" className="form-control mb-3" placeholder="New password (6+ characters)" autoComplete="new-password" value={pw.new} onChange={(e) => setPw({ ...pw, new: e.target.value })} />
          <button className="btn btn-soft w-100" disabled={!pw.current || pw.new.length < 6}>Update password</button>
        </form>
      </div>
      <div className="col-lg-8">
        <form className="ff-card ff-card-pad" onSubmit={save} noValidate>
          <h5 className="serif mb-3">{farmer ? 'Farm details' : 'Your details'}</h5>
          <ErrorBox error={error} />
          <div className="row g-3">
            <div className="col-sm-6"><label className="form-label" htmlFor="p-name">Full name</label><input id="p-name" className="form-control" value={form.name} onChange={set('name')} /></div>
            <div className="col-sm-6"><label className="form-label" htmlFor="p-phone">Mobile number</label><input id="p-phone" className="form-control" maxLength="10" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} /></div>
            {farmer && <div className="col-12"><label className="form-label" htmlFor="p-farm">Farm name</label><input id="p-farm" className="form-control" value={form.farm_name} onChange={set('farm_name')} /></div>}
            <div className="col-sm-6">
              <label className="form-label" htmlFor="p-district">District</label>
              <select id="p-district" className="form-select" value={form.district} onChange={set('district')}>
                <option value="">Select</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            {farmer && <div className="col-sm-6"><label className="form-label" htmlFor="p-village">Village</label><input id="p-village" className="form-control" value={form.village} onChange={set('village')} /></div>}
            <div className="col-12"><label className="form-label" htmlFor="p-addr">{farmer ? 'Farm address / pickup point' : 'Default delivery address'}</label><textarea id="p-addr" rows="3" className="form-control" value={form.address} onChange={set('address')} /></div>
          </div>
          <button className="btn btn-primary mt-4" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>
      </div>
    </div>
  )

  if (inDashboard) return <><DashTitle title="Farm profile" subtitle="This is what buyers see on your products." />{body}</>
  return <div className="container py-4 py-lg-5"><h1 className="mb-4">My profile</h1>{body}</div>
}
