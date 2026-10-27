import { Link } from 'react-router-dom'
import { api, asset } from '../../api'
import ProductCard from '../../components/ProductCard'
import { photoFor } from '../../photos'
import { Loader, useApi, useTitle } from '../../components/ui'
import { CATEGORIES, initials } from '../../utils'

const STEPS = [
  { icon: 'flower1', tone: 'tone-olive', title: 'Farmers list their harvest', text: 'Local farmers add what they picked today with a fair price they set themselves.' },
  { icon: 'basket2', tone: 'tone-mustard', title: 'You fill your basket', text: 'Browse by category or district, read reviews and order directly from the farm.' },
  { icon: 'truck', tone: 'tone-terracotta', title: 'Fresh at your doorstep', text: 'The farmer packs and delivers, or you pick up. Pay cash on delivery.' },
]

export default function Home() {
  useTitle('')
  const meta = useApi(() => api.get('products', 'meta'))
  const featured = useApi(() => api.get('products', 'list', { sort: 'rating', limit: 8, in_stock: 1 }))
  const stats = meta.data?.stats

  return (
    <>
      {/* Hero */}
      <section className="ff-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="ff-pill mb-3"><i className="bi bi-sun" /> Harvested this morning</span>
              <h1 className="mb-3">From the farmer's field <em>straight</em> to your kitchen</h1>
              <p className="lead mb-4">
                Buy fresh vegetables, fruits and grains directly from local farmers. No middlemen —
                farmers earn more, and you pay less for fresher food.
              </p>
              <div className="d-flex flex-wrap gap-2 mb-5">
                <Link to="/shop" className="btn btn-primary btn-lg">Shop fresh produce <i className="bi bi-arrow-right ms-1" /></Link>
                <Link to="/register?role=farmer" className="btn btn-soft btn-lg">I'm a farmer</Link>
              </div>
              {stats && (
                <div className="ff-stat-strip">
                  <div><strong>{stats.farmers}+</strong><span>Local farmers</span></div>
                  <div><strong>{stats.products}+</strong><span>Fresh products</span></div>
                  <div><strong>0%</strong><span>Middleman cut</span></div>
                </div>
              )}
            </div>
            <div className="col-lg-6 text-center">
              <img src={asset('images/hero-farm.svg')} alt="Illustration of a farm with a basket of fresh vegetables" className="ff-hero-art" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="ff-section pt-3">
        <div className="container">
          <div className="ff-section-title">
            <span className="small-caps text-terracotta">Shop by category</span>
            <h2>What's fresh today?</h2>
          </div>
          <div className="row g-3">
            {CATEGORIES.map((c) => (
              <div className="col-6 col-lg-3" key={c.name}>
                <Link to={`/shop?category=${encodeURIComponent(c.name)}`} className="ff-cat">
                  <img src={photoFor(c.icon)} alt="" />
                  <div><h6>{c.name}</h6><span className="small text-muted">{c.blurb}</span></div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="ff-section bg-sand">
        <div className="container">
          <div className="ff-section-title center">
            <span className="small-caps text-terracotta">How it works</span>
            <h2>Three simple steps, no middlemen</h2>
            <p>A shorter journey from the field means fresher food and a fairer price for the people who grow it.</p>
          </div>
          <div className="row g-4">
            {STEPS.map((s, i) => (
              <div className="col-md-4" key={s.title}>
                <div className="ff-card ff-step h-100">
                  <div className={`ff-step-icon ${s.tone}`}><i className={`bi bi-${s.icon}`} /></div>
                  <div className="small-caps text-muted mb-1">Step {i + 1}</div>
                  <h5 className="serif">{s.title}</h5>
                  <p className="text-muted mb-0">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="ff-section">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 ff-section-title">
            <div>
              <span className="small-caps text-terracotta">Customer favourites</span>
              <h2>Loved by families nearby</h2>
            </div>
            <Link to="/shop" className="btn btn-outline-primary">See all products</Link>
          </div>
          {featured.loading ? <Loader /> : (
            <div className="row g-4">
              {(featured.data || []).map((p) => (
                <div className="col-6 col-md-4 col-lg-3" key={p.id}><ProductCard p={p} /></div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Farmers */}
      {meta.data?.farmers?.length > 0 && (
        <section className="ff-section pt-0">
          <div className="container">
            <div className="ff-section-title center">
              <span className="small-caps text-terracotta">Meet the growers</span>
              <h2>The hands behind your food</h2>
            </div>
            <div className="row g-4 justify-content-center">
              {meta.data.farmers.map((f, i) => (
                <div className="col-sm-6 col-lg-4" key={f.id}>
                  <div className="ff-card ff-farmer-card">
                    <span className={`avatar ${['olive', 'mustard', ''][i % 3]}`}>{initials(f.name)}</span>
                    <h5 className="serif mb-1">{f.farm_name}</h5>
                    <div className="text-muted mb-3">{f.name} · {f.village}, {f.district}</div>
                    <Link to={`/shop?farmer=${f.id}`} className="btn btn-soft btn-sm">{f.products} products <i className="bi bi-arrow-right" /></Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Farmer call to action */}
      <section className="container">
        <div className="ff-quote">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className="small-caps" style={{ opacity: .8 }}>For farmers</span>
              <h2 className="mt-2 mb-2">Sell your harvest at your own price</h2>
              <p className="mb-0" style={{ opacity: .9, maxWidth: 560 }}>
                Register your farm, list your produce in minutes with ready-made photos and descriptions,
                and reach families in nearby towns directly.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link to="/register?role=farmer" className="btn btn-lg" style={{ background: '#fff', color: 'var(--ff-terracotta)' }}>
                Register your farm
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
