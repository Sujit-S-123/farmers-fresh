import { Link } from 'react-router-dom'
import { api } from '../../api'
import { EmptyState, ErrorBox, HBar, Loader, StatCard, WeekBars, useApi, useTitle } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { DashTitle } from '../../layouts/DashboardLayout'
import { qty, rupees } from '../../utils'

export default function FarmerDashboard() {
  useTitle('Farmer dashboard')
  const { user } = useAuth()
  const { data: s, loading, error } = useApi(() => api.get('farmer', 'stats'))
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <DashTitle title={`${greet}, ${user.name.split(' ')[0]}`} subtitle="Here's how your farm is doing on Farmer's Fresh."
        action={<Link to="/farmer/products/new" className="btn btn-primary"><i className="bi bi-plus-lg me-1" /> Add product</Link>} />
      <ErrorBox error={error} />
      {loading || !s ? <Loader /> : (
        <>
          {s.new_orders > 0 && (
            <div className="alert alert-warm d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
              <span><i className="bi bi-bell-fill me-2" /><strong>{s.new_orders} new order{s.new_orders > 1 ? 's' : ''}</strong> waiting for you to accept.</span>
              <Link to="/farmer/orders" className="btn btn-sm btn-primary">Review orders</Link>
            </div>
          )}
          <div className="row g-3 mb-4">
            <div className="col-6 col-xl-3"><StatCard icon="wallet2" tone="olive" label="Earned (delivered)" value={rupees(s.earnings)} /></div>
            <div className="col-6 col-xl-3"><StatCard icon="hourglass-split" tone="mustard" label="Orders in progress" value={s.new_orders + s.active_orders} to="/farmer/orders" /></div>
            <div className="col-6 col-xl-3"><StatCard icon="basket" tone="terracotta" label="Products listed" value={s.products} to="/farmer/products" /></div>
            <div className="col-6 col-xl-3"><StatCard icon="star" tone="brown" label="Average rating" value={s.rating ? `${s.rating} ★` : '—'} /></div>
          </div>
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="ff-card ff-card-pad h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="serif mb-0">Sales this week</h5>
                  <span className="small text-muted">Pending: {rupees(s.pending_value)}</span>
                </div>
                <WeekBars rows={s.last7} />
              </div>
            </div>
            <div className="col-lg-5">
              <div className="ff-card ff-card-pad h-100">
                <h5 className="serif mb-3">Best sellers</h5>
                {s.top.length === 0 ? <p className="text-muted">No sales yet.</p> : s.top.map((t, i) => (
                  <HBar key={t.name} label={`${t.name} · ${qty(t.qty)} sold`} value={rupees(t.revenue)} width={Number(t.revenue) / Number(s.top[0].revenue)}
                    color={['var(--ff-terracotta)', 'var(--ff-mustard)', 'var(--ff-olive)', '#b5683f', '#9a8a6a'][i]} />
                ))}
              </div>
            </div>
            <div className="col-12">
              <div className="ff-card ff-card-pad">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="serif mb-0">Running low</h5>
                  <Link to="/farmer/products" className="small fw-bold">Update stock</Link>
                </div>
                {s.low_stock.length === 0 ? (
                  <EmptyState icon="check2-circle" title="Stock looks healthy" text="All your active products have 30 or more units available." />
                ) : (
                  <div className="row g-3 mt-1">
                    {s.low_stock.map((p) => (
                      <div className="col-sm-6 col-lg-4" key={p.id}>
                        <Link to={`/farmer/products/${p.id}/edit`} className="d-flex align-items-center gap-3 p-2 rounded-4 bg-sand text-reset">
                          <img src={p.image} alt="" className="ff-thumb" />
                          <div><div className="fw-bold">{p.name}</div><div className="small text-terracotta fw-bold">{qty(p.quantity)} {p.unit} left</div></div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
