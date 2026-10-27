import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { EmptyState, ErrorBox, Loader, StatusBadge, useApi, useTitle } from '../../components/ui'
import { useConfirm, useToast } from '../../context/ToastContext'
import { ORDER_STEPS, dateTime, qty, rupees } from '../../utils'

function Tracker({ status }) {
  const at = ORDER_STEPS.indexOf(status)
  return (
    <div className="ff-track">
      {ORDER_STEPS.map((s, i) => (
        <Fragment key={s}>
          {i > 0 && <div className={`ff-track-line ${i <= at ? 'done' : ''}`} />}
          <div className={`ff-track-step ${i <= at ? 'done' : ''}`}>
            <div className="ff-track-dot">{i <= at ? <i className="bi bi-check-lg" /> : i + 1}</div>{s}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

export default function MyOrders() {
  useTitle('My orders')
  const { data, loading, error, reload } = useApi(() => api.get('orders', 'mine'))
  const [tab, setTab] = useState('active')
  const toast = useToast()
  const confirm = useConfirm()

  const cancel = async (id) => {
    if (!(await confirm(`Cancel order #${id}?`, 'Cancel order'))) return
    try { await api.post('orders', 'cancel', { id }); toast('Order cancelled'); reload() } catch (e) { toast(e.message, 'error') }
  }

  const list = (data || []).filter((o) => (tab === 'active' ? ['Placed', 'Accepted', 'Packed'].includes(o.status) : !['Placed', 'Accepted', 'Packed'].includes(o.status)))

  return (
    <div className="container py-4 py-lg-5" style={{ maxWidth: 960 }}>
      <h1 className="mb-1">My orders</h1>
      <p className="text-muted mb-4">Track what's on the way and review what you've received.</p>
      <div className="d-flex gap-2 mb-4">
        <button className={`ff-chip ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>In progress</button>
        <button className={`ff-chip ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>Completed & cancelled</button>
      </div>
      <ErrorBox error={error} />
      {loading ? <Loader /> : list.length === 0 ? (
        <div className="ff-card"><EmptyState icon="receipt" title={tab === 'active' ? 'No orders in progress' : 'No past orders yet'} text="When you place an order it will show up here." action={<Link to="/shop" className="btn btn-primary">Shop now</Link>} /></div>
      ) : list.map((o) => (
        <div className="ff-card ff-order" key={o.id}>
          <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start">
            <div>
              <div className="fw-bold fs-5 serif">Order #{o.id}</div>
              <div className="small text-muted">{dateTime(o.created_at)} · {o.farm_name} ({o.village}, {o.district})</div>
            </div>
            <div className="text-end">
              <StatusBadge status={o.status} />
              <div className="fw-bold fs-5 mt-1">{rupees(o.total)}</div>
            </div>
          </div>
          {ORDER_STEPS.includes(o.status) && <Tracker status={o.status} />}
          <div className="ff-order-items mt-3">
            {o.items.map((i) => (
              <Link to={`/product/${i.product_id}`} className="ff-mini text-reset" key={i.product_id}>
                <img src={i.image} alt="" /> {i.product_name} · {qty(i.quantity)} {i.unit}
              </Link>
            ))}
          </div>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 pt-3 border-top">
            <span className="small text-muted">
              <i className={`bi ${o.payment_mode === 'COD' ? 'bi-truck' : 'bi-shop'} me-1`} />
              {o.payment_mode === 'COD' ? 'Cash on delivery' : 'Pickup from farm'} · Farmer: {o.farmer_phone}
            </span>
            <div className="d-flex gap-2">
              {o.status === 'Placed' && <button className="btn btn-light-danger btn-sm" onClick={() => cancel(o.id)}>Cancel order</button>}
              {o.status === 'Delivered' && <Link to={`/product/${o.items[0]?.product_id}`} className="btn btn-soft btn-sm"><i className="bi bi-star me-1" />Write a review</Link>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
