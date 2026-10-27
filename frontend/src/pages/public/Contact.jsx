import { useState } from 'react'
import { api } from '../../api'
import { ErrorBox, useTitle } from '../../components/ui'

const FAQ = [
  ['How do I pay?', 'Pay in cash when your order is delivered, or choose pickup and pay at the farm.'],
  ['How fresh is the produce?', 'Farmers list what they harvest and pack your order only after you place it.'],
  ['Can I cancel an order?', 'Yes, while it is still "Placed". Once the farmer accepts it, contact them directly.'],
  ['How do I start selling?', 'Register as a farmer. Our team approves new farms within a day, then you can add products.'],
]

export default function Contact() {
  useTitle('Contact')
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.message.trim().length < 10) return setError('Please write a slightly longer message.')
    setBusy(true)
    try {
      await api.post('contact', 'send', form)
      setSent(true)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <>
      <div className="ff-page-head">
        <div className="container"><h1>Contact us</h1><p>Questions, delivery areas or feedback — we'd love to hear from you.</p></div>
      </div>
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="ff-card ff-card-pad">
              {sent ? (
                <div className="text-center py-4">
                  <div className="ff-empty-icon"><i className="bi bi-envelope-check" /></div>
                  <h4>Message sent</h4>
                  <p className="text-muted">Thank you, {form.name.split(' ')[0]}. We'll reply to {form.email} soon.</p>
                  <button className="btn btn-soft" onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }) }}>Send another</button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h4 className="mb-3">Send us a message</h4>
                  <ErrorBox error={error} />
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label" htmlFor="c-name">Your name</label>
                      <input id="c-name" className="form-control" required value={form.name} onChange={set('name')} />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label" htmlFor="c-email">Email</label>
                      <input id="c-email" type="email" className="form-control" required value={form.email} onChange={set('email')} />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="c-msg">Message</label>
                      <textarea id="c-msg" rows="5" className="form-control" required value={form.message} onChange={set('message')} />
                    </div>
                  </div>
                  <button className="btn btn-primary mt-3" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
                </form>
              )}
            </div>
          </div>
          <div className="col-lg-5">
            <div className="ff-card ff-card-pad mb-4">
              <div className="d-flex gap-3 mb-3"><span className="ff-stat-icon tone-terracotta"><i className="bi bi-telephone" /></span><div><div className="fw-bold">Phone</div><div className="text-muted">+91 90000 00000 (9am – 6pm)</div></div></div>
              <div className="d-flex gap-3 mb-3"><span className="ff-stat-icon tone-olive"><i className="bi bi-envelope" /></span><div><div className="fw-bold">Email</div><div className="text-muted">hello@farmersfresh.in</div></div></div>
              <div className="d-flex gap-3"><span className="ff-stat-icon tone-mustard"><i className="bi bi-geo-alt" /></span><div><div className="fw-bold">Office</div><div className="text-muted">Chennai, Tamil Nadu</div></div></div>
            </div>
            <div className="ff-card ff-card-pad">
              <h5 className="serif mb-3">Common questions</h5>
              {FAQ.map(([q, a]) => (
                <details key={q} className="mb-3">
                  <summary className="fw-bold" style={{ cursor: 'pointer' }}>{q}</summary>
                  <p className="text-muted mt-2 mb-0">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
