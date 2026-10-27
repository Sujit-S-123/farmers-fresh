import { Link } from 'react-router-dom'
import { api } from '../../api'
import { ErrorBox, HBar, Loader, StatCard, StatusBadge, WeekBars, useApi, useTitle } from '../../components/ui'
import { DashTitle } from '../../layouts/DashboardLayout'
import { dateTime, rupees } from '../../utils'

const STATUS_COLORS = { Placed: 'var(--ff-mustard)', Accepted: '#5b88b5', Packed: '#9468ab', Delivered: 'var(--ff-olive)', Rejected: '#c0604d', Cancelled: '#b9a596' }
const CAT_COLORS = ['var(--ff-olive)', 'var(--ff-terracotta)', 'var(--ff-mustard)', '#b5683f']

export default function AdminDashboard() {
  useTitle('Admin overview')
  const { data: s, loading, error } = useApi(() => api.get('admin', 'stats'))

  return (
    <>
      <DashTitle title="Marketplace overview" subtitle="A quick look at farmers, buyers and orders." />
      <ErrorBox error={error} />
      {loading || !s ? <Loader /> : (
        <>
          {s.pending_farmers > 0 && (
            <div className="alert alert-warm d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
              <span><i className="bi bi-person-exclamation me-2" /><strong>{s.pending_farmers} farmer{s.pending_farmers > 1 ? 's' : ''}</strong> waiting for approval.</span>
              <Link to="/admin/farmers" className="btn btn-sm btn-primary">Review now</Link>
            </div>
          )}
          <div className="row g-3 mb-4">
            <div className="col-6 col-xl-3"><StatCard icon="people" tone="olive" label="Approved farmers" value={s.farmers} to="/admin/farmers" /></div>
            <div className="col-6 col-xl-3"><StatCard icon="person-hearts" tone="terracotta" label="Consumers" value={s.consumers} to="/admin/consumers" /></div>
            <div className="col-6 col-xl-3"><StatCard icon="receipt" tone="mustard" label="Total orders" value={s.orders} to="/admin/orders" /></div>
            <div className="col-6 col-xl-3"><StatCard icon="currency-rupee" tone="brown" label="Delivered sales" value={rupees(s.revenue)} /></div>
          </div>
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="ff-card ff-card-pad h-100">
                <h5 className="serif mb-0">Orders this week</h5>
                <WeekBars rows={s.last7} valueKey="orders" money={false} />
              </div>
            </div>
            <div className="col-lg-5">
              <div className="ff-card ff-card-pad h-100">
                <h5 className="serif mb-3">Orders by status</h5>
                {s.by_status.map((r) => (
                  <HBar key={r.status} label={r.status} value={r.count} width={r.count / Math.max(...s.by_status.map((x) => x.count))} color={STATUS_COLORS[r.status]} />
                ))}
              </div>
            </div>
            <div className="col-lg-7">
              <div className="ff-card overflow-hidden h-100">
                <div className="d-flex justify-content-between align-items-center p-3 px-4">
                  <h5 className="serif mb-0">Recent orders</h5>
                  <Link to="/admin/orders" className="small fw-bold">View all</Link>
                </div>
                <div className="table-responsive">
                  <table className="table ff-table">
                    <thead><tr><th>#</th><th>Buyer</th><th>Farm</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>
                      {s.recent.map((o) => (
                        <tr key={o.id}>
                          <td className="fw-bold">{o.id}</td>
                          <td>{o.consumer_name}<div className="small text-muted">{dateTime(o.created_at)}</div></td>
                          <td>{o.farm_name}</td>
                          <td className="fw-bold">{rupees(o.total)}</td>
                          <td><StatusBadge status={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="ff-card ff-card-pad h-100">
                <h5 className="serif mb-3">Listings by category</h5>
                {s.by_category.map((r, i) => (
                  <HBar key={r.category} label={r.category} value={r.count} width={r.count / Math.max(...s.by_category.map((x) => x.count))} color={CAT_COLORS[i % 4]} />
                ))}
                <div className="d-flex gap-2 mt-4">
                  <Link to="/admin/products" className="btn btn-soft btn-sm">Manage products</Link>
                  <Link to="/admin/messages" className="btn btn-soft btn-sm">Messages ({s.messages})</Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
