import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '../../api'
import { EmptyState, ErrorBox, useTitle } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { rupees } from '../../utils'

export default function Checkout() {
  useTitle('Checkout')
  const { user } = useAuth()
  const { items, subtotal, clear } = useCart()
  const [form, setForm] = useState({ payment_mode: 'COD', address: user.address || '', phone: user.phone || '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [placed, setPlaced] = useState(null)

  if (placed) {
    return (
      <div className="container py-5">
        <div className="ff-card mx-auto" style={{ maxWidth: 620 }}>
          <EmptyState icon="check2-circle" title="Order placed — thank you!"
            text={`Your order${placed.length > 1 ? 's' : ''} ${placed.map((id) => '#' + id).join(', ')} ${placed.length > 1 ? 'have' : 'has'} been sent to the farmer. You'll see updates as it's accepted, packed and delivered.`}
            action={<div className="d-flex gap-2 justify-content-center"><Link to="/my-orders" className="btn btn-primary">Track my orders</Link><Link to="/shop" className="btn btn-soft">Continue shopping</Link></div>} />
        </div>
      </div>
    )
  }
  if (!items.length) return <Navigate to="/cart" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError('Please enter a valid 10-digit mobile number.')
    if (form.payment_mode === 'COD' && form.address.trim().length < 10) return setError('Please enter your full delivery address.')
    setBusy(true)
    try {
      const d = await api.post('orders', 'place', { ...form, items: items.map((i) => ({ product_id: i.id, quantity: i.qty })) })
      clear()
      setPlaced(d.order_ids)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="container py-4 py-lg-5">
      <h1 className="mb-4">Checkout</h1>
      <form className="row g-4" onSubmit={submit} noValidate>
        <div className="col-lg-7">
          <div className="ff-card ff-card-pad mb-4">
            <h5 className="serif mb-3">1. How would you like to receive it?</h5>
            <div className="row g-3">
              {[
                { v: 'COD', icon: 'truck', t: 'Home delivery', s: 'Pay cash when it arrives' },
                { v: 'Pickup', icon: 'shop', t: 'Pick up from farm', s: 'Pay at the farm' },
              ].map((o) => (
                <div className="col-sm-6" key={o.v}>
                  <label className={`ff-option ${form.payment_mode === o.v ? 'active' : ''}`}>
                    <input type="radio" name="mode" className="d-none" checked={form.payment_mode === o.v} onChange={() => setForm({ ...form, payment_mode: o.v })} />
                    <i className={`bi bi-${o.icon}`} />
                    <div><div className="fw-bold">{o.t}</div><div className="small text-muted">{o.s}</div></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="ff-card ff-card-pad">
            <h5 className="serif mb-3">2. Your details</h5>
            <ErrorBox error={error} />
            <div className="mb-3">
              <label className="form-label" htmlFor="ck-phone">Mobile number</label>
              <input id="ck-phone" className="form-control" inputMode="numeric" maxLength="10" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
            </div>
            {form.payment_mode === 'COD' ? (
              <div>
                <label className="form-label" htmlFor="ck-addr">Delivery address</label>
                <textarea id="ck-addr" className="form-control" rows="3" placeholder="House no, street, area, city, pincode" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            ) : (
              <div className="alert alert-success mb-0 small"><i className="bi bi-geo-alt me-1" /> The farmer will call you with the pickup location and time.</div>
            )}
          </div>
        </div>
        <div className="col-lg-5">
          <div className="ff-card ff-card-pad">
            <h5 className="serif mb-3">Your order</h5>
            {items.map((i) => (
              <div className="d-flex align-items-center gap-3 mb-3" key={i.id}>
                <img src={i.image} alt="" className="ff-thumb" />
                <div className="flex-grow-1"><div className="fw-bold">{i.name}</div><div className="small text-muted">{i.qty} {i.unit} × {rupees(i.price)}</div></div>
                <div className="fw-bold">{rupees(i.qty * i.price)}</div>
              </div>
            ))}
            <div className="ff-summary-row"><span className="text-muted">Delivery</span><span className="fw-bold text-olive">Free</span></div>
            <div className="ff-summary-row ff-summary-total"><span>Total</span><span>{rupees(subtotal)}</span></div>
            <button className="btn btn-primary btn-lg w-100 mt-3" disabled={busy}>{busy ? 'Placing order…' : `Place order · ${rupees(subtotal)}`}</button>
            <p className="small text-muted text-center mt-2 mb-0">You can cancel until the farmer accepts it.</p>
          </div>
        </div>
      </form>
    </div>
  )
}
