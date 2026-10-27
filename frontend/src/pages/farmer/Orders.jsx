import { useState } from 'react'
import { api } from '../../api'
import { EmptyState, ErrorBox, Loader, StatusBadge, useApi, useTitle } from '../../components/ui'
import { useConfirm, useToast } from '../../context/ToastContext'
import { DashTitle } from '../../layouts/DashboardLayout'
import { dateTime, qty, rupees } from '../../utils'

const NEXT = {
  Placed: [{ to: 'Accepted', label: 'Accept order', cls: 'btn-olive', icon: 'check-lg' }, { to: 'Rejected', label: 'Reject', cls: 'btn-light-danger', icon: 'x-lg' }],
  Accepted: [{ to: 'Packed', label: 'Mark as packed', cls: 'btn-primary', icon: 'box-seam' }],
  Packed: [{ to: 'Delivered', label: 'Mark as delivered', cls: 'btn-olive', icon: 'truck' }],
}
const TABS = { new: ['Placed'], progress: ['Accepted', 'Packed'], done: ['Delivered', 'Rejected', 'Cancelled'] }

export default function FarmerOrders() {
  useTitle('Orders received')
  const { data, loading, error, reload } = useApi(() => api.get('orders', 'farmer'))
  const [tab, setTab] = useState('new')
  const [busy, setBusy] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()

  const update = async (o, status) => {
    if (status === 'Rejected' && !(await confirm(`Reject order #${o.id}? The stock will be added back.`, 'Reject'))) return
    setBusy(o.id)
    try { await api.post('orders', 'update_status', { id: o.id, status }); toast(`Order #${o.id} marked ${status}`); await reload() }
    catch (e) { toast(e.message, 'error') } finally { setBusy(null) }
  }

  const count = (t) => (data || []).filter((o) => TABS[t].includes(o.status)).length
  const list = (data || []).filter((o) => TABS[tab].includes(o.status))

  return (
    <>
      <DashTitle title="Orders received" subtitle="Accept new orders, then mark them packed and delivered." />
      <div className="d-flex flex-wrap gap-2 mb-4">
        {[['new', 'New'], ['progress', 'In progress'], ['done', 'Completed']].map(([k, l]) => (
          <button key={k} className={`ff-chip ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l} ({count(k)})</button>
        ))}
      </div>
      <ErrorBox error={error} />
      {loading ? <Loader /> : list.length === 0 ? (
        <div className="ff-card"><EmptyState icon="inbox" title="Nothing here" text={tab === 'new' ? 'New orders from buyers will appear here.' : 'No orders in this list yet.'} /></div>
      ) : (
        <div className="row g-4">
          {list.map((o) => (
            <div className="col-xl-6" key={o.id}>
              <div className="ff-card ff-order h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <div className="fw-bold fs-5 serif">Order #{o.id}</div>
                    <div className="small text-muted">{dateTime(o.created_at)}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="bg-sand rounded-4 p-3 my-3 small">
                  <div className="fw-bold mb-1"><i className="bi bi-person me-1" />{o.consumer_name} · <a href={`tel:${o.phone}`}>{o.phone}</a></div>
                  <div className="text-muted">
                    <i className={`bi ${o.payment_mode === 'COD' ? 'bi-geo-alt' : 'bi-shop'} me-1`} />
                    {o.payment_mode === 'COD' ? o.delivery_address : 'Buyer will pick up from your farm'}
                  </div>
                </div>
                {o.items.map((i) => (
                  <div className="d-flex align-items-center gap-3 mb-2" key={i.product_id}>
                    <img src={i.image} alt="" className="ff-thumb" style={{ width: 40, height: 40 }} />
                    <div className="flex-grow-1 fw-semibold">{i.product_name}<span className="text-muted fw-normal"> · {qty(i.quantity)} {i.unit} × {rupees(i.price)}</span></div>
                    <div className="fw-bold">{rupees(i.quantity * i.price)}</div>
                  </div>
                ))}
                <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-auto flex-wrap gap-2">
                  <div><span className="text-muted small">{o.payment_mode === 'COD' ? 'Collect cash' : 'Collect at pickup'}</span><div className="fw-bold fs-5">{rupees(o.total)}</div></div>
                  <div className="d-flex gap-2">
                    {(NEXT[o.status] || []).map((n) => (
                      <button key={n.to} className={`btn btn-sm ${n.cls}`} disabled={busy === o.id} onClick={() => update(o, n.to)}>
                        <i className={`bi bi-${n.icon} me-1`} />{n.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
