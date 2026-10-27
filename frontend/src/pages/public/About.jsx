import { asset } from '../../api'
import { Link } from 'react-router-dom'
import { useTitle } from '../../components/ui'

const VALUES = [
  { icon: 'cash-coin', tone: 'tone-olive', title: 'Fair price for farmers', text: 'Farmers set their own prices and keep what they earn. No commission agents in between.' },
  { icon: 'clock-history', tone: 'tone-mustard', title: 'Fresher for families', text: 'Produce travels from the field to your home in a day, not a week through wholesale markets.' },
  { icon: 'geo-alt', tone: 'tone-terracotta', title: 'Local and transparent', text: 'Every product shows who grew it and where, so you always know where your food comes from.' },
]

export default function About() {
  useTitle('About')
  return (
    <>
      <div className="ff-page-head">
        <div className="container">
          <h1>About Farmer's Fresh</h1>
          <p>A local marketplace that connects the people who grow food with the people who eat it.</p>
        </div>
      </div>
      <div className="container py-5">
        <div className="row g-5 align-items-center mb-5">
          <div className="col-lg-6">
            <span className="small-caps text-terracotta">The problem</span>
            <h2 className="mt-2">Farmers earn little, buyers pay a lot</h2>
            <p className="text-muted">
              A tomato often passes through a commission agent, a wholesaler and a retailer before it reaches your kitchen.
              Each step adds cost and days of delay. The farmer receives only a small share of what you pay, and the
              produce loses freshness along the way.
            </p>
            <span className="small-caps text-olive d-block mt-4">Our answer</span>
            <h2 className="mt-2">Buy directly from the farm</h2>
            <p className="text-muted mb-0">
              Farmer's Fresh lets farmers list their harvest themselves and lets nearby families order it directly.
              The farmer packs and delivers, or you pick it up. Everyone wins: a better price for the grower,
              fresher food for you.
            </p>
          </div>
          <div className="col-lg-6">
            <img src={asset('images/hero-farm.svg')} alt="" className="ff-hero-art" />
          </div>
        </div>

        <div className="row g-4 mb-5">
          {VALUES.map((v) => (
            <div className="col-md-4" key={v.title}>
              <div className="ff-card ff-step h-100">
                <div className={`ff-step-icon ${v.tone}`}><i className={`bi bi-${v.icon}`} /></div>
                <h5 className="serif">{v.title}</h5>
                <p className="text-muted mb-0">{v.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="ff-card ff-card-pad">
          <div className="row g-4">
            <div className="col-md-4">
              <h5 className="serif"><i className="bi bi-person-heart text-terracotta me-2" />For consumers</h5>
              <p className="text-muted mb-0">Browse and filter produce, add to cart, place orders with cash on delivery, track every order and review what you receive.</p>
            </div>
            <div className="col-md-4">
              <h5 className="serif"><i className="bi bi-flower1 text-olive me-2" />For farmers</h5>
              <p className="text-muted mb-0">Add products in seconds with ready-made photos and descriptions, manage stock, accept orders and see your earnings.</p>
            </div>
            <div className="col-md-4">
              <h5 className="serif"><i className="bi bi-shield-check text-mustard me-2" />For admins</h5>
              <p className="text-muted mb-0">Approve new farmers, remove bad listings, manage users and keep an eye on all orders and sales.</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-5">
          <Link to="/shop" className="btn btn-primary btn-lg me-2">Start shopping</Link>
          <Link to="/register?role=farmer" className="btn btn-soft btn-lg">Sell as a farmer</Link>
        </div>
      </div>
    </>
  )
}
