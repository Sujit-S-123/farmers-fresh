import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { qty, rupees } from '../utils'
import { Stars } from './ui'

export default function ProductCard({ p }) {
  const { user } = useAuth()
  const { add } = useCart()
  const toast = useToast()
  const canBuy = !user || user.role === 'consumer'
  const out = Number(p.quantity) <= 0
  const low = !out && Number(p.quantity) < 20

  return (
    <div className="ff-product">
      <Link to={`/product/${p.id}`} className="ff-product-img">
        <img src={p.image} alt={p.name} loading="lazy" />
        <div className="ff-product-tags">
          {Number(p.is_organic) === 1 && <span className="ff-tag olive"><i className="bi bi-leaf" /> Natural</span>}
          {out && <span className="ff-tag terracotta">Sold out</span>}
          {low && <span className="ff-tag mustard">Only {qty(p.quantity)} left</span>}
        </div>
      </Link>
      <div className="ff-product-body">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h5><Link to={`/product/${p.id}`}>{p.name}</Link></h5>
        </div>
        <div className="ff-product-farm mb-2"><i className="bi bi-geo-alt" /> {p.farm_name}, {p.district}</div>
        <div className="mb-3"><Stars value={p.rating} count={p.review_count} /></div>
        <div className="mt-auto d-flex align-items-center justify-content-between">
          <div className="ff-price">{rupees(p.price)} <small>/ {p.unit}</small></div>
          {canBuy && (
            <button
              className="btn btn-primary btn-icon" disabled={out}
              aria-label={`Add ${p.name} to cart`} title="Add to cart"
              onClick={() => { add(p, 1); toast(`${p.name} added to your cart`) }}
            >
              <i className="bi bi-bag-plus" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
