import { Link, useNavigate } from 'react-router-dom'
import { EmptyState, QtyInput, useTitle } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { rupees } from '../../utils'

export default function Cart() {
  useTitle('Your cart')
  const { items, setQty, remove, subtotal, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const farms = new Set(items.map((i) => i.farmer_id)).size

  if (!items.length) {
    return (
      <div className="container py-5">
        <div className="ff-card">
          <EmptyState icon="basket2" title="Your basket is empty" text="Fresh vegetables, fruits and grains are waiting for you."
            action={<Link to="/shop" className="btn btn-primary">Start shopping</Link>} />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4 py-lg-5">
      <h1 className="mb-1">Your cart</h1>
      <p className="text-muted mb-4">{items.length} item{items.length > 1 ? 's' : ''} from {farms} farm{farms > 1 ? 's' : ''}</p>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="ff-card ff-card-pad">
            {items.map((i) => (
              <div className="ff-cart-item" key={i.id}>
                <Link to={`/product/${i.id}`}><img src={i.image} alt={i.name} /></Link>
                <div className="flex-grow-1 min-w-0">
                  <Link to={`/product/${i.id}`} className="fw-bold text-reset serif fs-5">{i.name}</Link>
                  <div className="small text-muted">{i.farm_name}</div>
                  <div className="small fw-semibold mt-1">{rupees(i.price)} / {i.unit}</div>
                </div>
                <div className="d-flex flex-column flex-sm-row align-items-end align-items-sm-center gap-2 gap-sm-4">
                  <QtyInput small value={i.qty} max={i.stock} onChange={(v) => setQty(i.id, v)} />
                  <div className="fw-bold text-end" style={{ minWidth: 70 }}>{rupees(i.price * i.qty)}</div>
                  <button className="btn btn-light-danger btn-icon btn-sm" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`}><i className="bi bi-trash3" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-between mt-3">
            <Link to="/shop" className="btn btn-soft"><i className="bi bi-arrow-left me-1" /> Keep shopping</Link>
            <button className="btn btn-link text-muted" onClick={clear}>Empty cart</button>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="ff-card ff-card-pad">
            <h5 className="serif mb-3">Order summary</h5>
            <div className="ff-summary-row"><span className="text-muted">Items total</span><span className="fw-bold">{rupees(subtotal)}</span></div>
            <div className="ff-summary-row"><span className="text-muted">Delivery</span><span className="fw-bold text-olive">Free</span></div>
            <div className="ff-summary-row ff-summary-total"><span>To pay</span><span>{rupees(subtotal)}</span></div>
            {farms > 1 && <div className="alert alert-warm small mt-3 mb-0"><i className="bi bi-info-circle me-1" /> Items from different farms are delivered as separate orders.</div>}
            {user && user.role !== 'consumer' ? (
              <div className="alert alert-warm small mt-3 mb-0">Please log in with a consumer account to place orders.</div>
            ) : (
              <button className="btn btn-primary btn-lg w-100 mt-3" onClick={() => navigate(user ? '/checkout' : '/login', { state: { from: '/checkout' } })}>
                {user ? 'Proceed to checkout' : 'Log in to checkout'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
