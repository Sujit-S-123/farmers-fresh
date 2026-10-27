import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import ProductCard from '../../components/ProductCard'
import { creditFor } from '../../photos'
import { EmptyState, Loader, QtyInput, Stars, useApi, useTitle } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { dateShort, initials, qty, rupees } from '../../utils'

function ReviewForm({ productId, onDone }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('reviews', 'add', { product_id: productId, rating, comment })
      toast('Thank you for your review!')
      setComment('')
      onDone()
    } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="bg-sand p-3 rounded-4 mb-3">
      <div className="fw-bold mb-1">Rate this product</div>
      <div className="ff-star-input mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)} aria-label={`${n} stars`}>★</button>
        ))}
      </div>
      <textarea className="form-control mb-2" rows="2" maxLength="500" placeholder="How was the freshness and taste?" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn btn-primary btn-sm" disabled={busy}>Post review</button>
    </form>
  )
}

export default function ProductDetails() {
  const { id } = useParams()
  const { data: p, loading, error, reload } = useApi(() => api.get('products', 'get', { id }), [id])
  const { user } = useAuth()
  const { add, items } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [amount, setAmount] = useState(1)
  useTitle(p?.name)
  useEffect(() => setAmount(1), [id])

  if (loading) return <Loader />
  if (error || !p) return <div className="container py-5"><EmptyState icon="emoji-frown" title="Product not found" text={error} action={<Link to="/shop" className="btn btn-primary">Back to shop</Link>} /></div>

  const stock = Number(p.quantity)
  const inCart = items.find((i) => i.id === p.id)?.qty || 0
  const canBuy = (!user || user.role === 'consumer') && Number(p.is_active) === 1
  const addToCart = (go) => {
    add(p, amount)
    toast(`${amount} ${p.unit} of ${p.name} added to your cart`)
    if (go) navigate('/cart')
  }

  return (
    <div className="container py-4 py-lg-5">
      <nav className="small fw-semibold mb-4">
        <Link to="/shop">Shop</Link> <i className="bi bi-chevron-right mx-1 text-muted" />
        <Link to={`/shop?category=${encodeURIComponent(p.category)}`}>{p.category}</Link> <i className="bi bi-chevron-right mx-1 text-muted" />
        <span className="text-muted">{p.name}</span>
      </nav>

      <div className="row g-4 g-lg-5">
        <div className="col-lg-5">
          <div className="ff-detail-img position-relative">
            <img src={p.image} alt={p.name} />
            <div className="ff-product-tags">
              {Number(p.is_organic) === 1 && <span className="ff-tag olive"><i className="bi bi-flower1" /> Naturally grown</span>}
              <span className="ff-tag">{p.season}</span>
            </div>
          </div>
          {creditFor(p.image) && (
            <div className="small text-muted mt-2">
              Photo: {creditFor(p.image).artist}, <a href={creditFor(p.image).source} target="_blank" rel="noreferrer">{creditFor(p.image).license}</a>, via Wikimedia Commons
            </div>
          )}
        </div>

        <div className="col-lg-7">
          <span className="small-caps text-olive">{p.category}</span>
          <h1 className="mt-1 mb-2" style={{ fontSize: 'clamp(1.9rem,3.4vw,2.6rem)' }}>{p.name}</h1>
          <div className="d-flex align-items-center gap-3 mb-3">
            <Stars value={p.rating} count={p.review_count} />
            {p.rating && <span className="fw-bold">{p.rating} / 5</span>}
          </div>
          <p className="text-muted fs-6 mb-4" style={{ maxWidth: 560 }}>{p.description}</p>

          <div className="ff-card ff-card-pad mb-4">
            <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
              <div className="ff-price" style={{ fontSize: '2rem' }}>{rupees(p.price)} <small>per {p.unit}</small></div>
              {Number(p.typical_price) > Number(p.price) && (
                <span className="ff-badge st-Delivered">Save {rupees(p.typical_price - p.price)} vs market</span>
              )}
            </div>
            <div className="mb-3 fw-semibold">
              {stock > 0
                ? <span className="text-olive"><i className="bi bi-check-circle-fill me-1" />{qty(stock)} {p.unit} available</span>
                : <span className="text-terracotta"><i className="bi bi-x-circle-fill me-1" />Sold out for now</span>}
              {inCart > 0 && <span className="text-muted ms-2">· {inCart} in your cart</span>}
            </div>
            {canBuy && stock > 0 && (
              <div className="d-flex flex-wrap align-items-center gap-2">
                <QtyInput value={amount} onChange={setAmount} max={Math.max(1, stock - inCart)} />
                <button className="btn btn-primary" onClick={() => addToCart(false)} disabled={inCart >= stock}><i className="bi bi-bag-plus me-1" /> Add to cart</button>
                <button className="btn btn-soft" onClick={() => addToCart(true)} disabled={inCart >= stock}>Buy now</button>
              </div>
            )}
            {user && user.role !== 'consumer' && <div className="small text-muted">Log in with a consumer account to buy.</div>}
          </div>

          <div className="ff-farmer-box mb-4">
            <span className="avatar olive" style={{ width: 52, height: 52, fontSize: '1.1rem' }}>{initials(p.farmer_name)}</span>
            <div className="flex-grow-1">
              <div className="small-caps text-olive">Grown by</div>
              <div className="fw-bold">{p.farm_name}</div>
              <div className="small text-muted">{p.farmer_name} · {p.village}, {p.district}</div>
            </div>
            <Link to={`/shop?farmer=${p.farmer_id}`} className="btn btn-sm btn-olive">Visit farm</Link>
          </div>

          <div className="ff-info-row"><i className="bi bi-heart-pulse" /><div><div className="fw-bold">Health benefits</div><div className="text-muted">{p.benefits}</div></div></div>
          <div className="ff-info-row"><i className="bi bi-calendar3" /><div><div className="fw-bold">Best season</div><div className="text-muted">{p.season}</div></div></div>
          {p.notes && <div className="ff-info-row"><i className="bi bi-chat-quote" /><div><div className="fw-bold">Note from the farmer</div><div className="text-muted">{p.notes}</div></div></div>}
          <div className="ff-info-row"><i className="bi bi-truck" /><div><div className="fw-bold">Delivery</div><div className="text-muted">Cash on delivery, or pick up from the farm.</div></div></div>
        </div>
      </div>

      <div className="row g-4 mt-2">
        <div className="col-lg-7">
          <div className="ff-card ff-card-pad">
            <h4 className="mb-3">Reviews ({p.reviews.length})</h4>
            {p.can_review && <ReviewForm productId={p.id} onDone={reload} />}
            {p.reviews.length === 0 && <p className="text-muted mb-0">No reviews yet. Customers can review after their order is delivered.</p>}
            {p.reviews.map((r) => (
              <div className="ff-review" key={r.id}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="avatar mustard" style={{ width: 32, height: 32, fontSize: '.8rem' }}>{initials(r.name)}</span>
                  <span className="fw-bold">{r.name}</span>
                  <span className="text-muted small ms-auto">{dateShort(r.created_at)}</span>
                </div>
                <Stars value={r.rating} />
                {r.comment && <p className="mb-0 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {p.more_from_farmer.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-3">More from {p.farm_name}</h3>
          <div className="row g-4">
            {p.more_from_farmer.map((m) => <div className="col-6 col-lg-3" key={m.id}><ProductCard p={m} /></div>)}
          </div>
        </div>
      )}
    </div>
  )
}
