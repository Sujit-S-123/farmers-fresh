import { asset } from '../api'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { homeFor, useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { initials } from '../utils'

// Header + footer for visitors and consumers
function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { setOpen(false); setMenu(false) }, [location.pathname])
  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const isConsumer = !user || user.role === 'consumer'
  const doLogout = async () => { await logout(); navigate('/') }

  return (
    <nav className="navbar navbar-expand-lg ff-navbar sticky-top">
      <div className="container">
        <Link to="/" className="ff-brand navbar-brand">
          <img src={asset('favicon.svg')} alt="" /> Farmer's <span>Fresh</span>
        </Link>

        <div className="d-flex align-items-center gap-2 order-lg-3">
          {isConsumer && (
            <Link to="/cart" className="btn btn-soft btn-icon ff-cart-btn" aria-label="Cart">
              <i className="bi bi-basket2" />
              {count > 0 && <span className="ff-cart-count">{count}</span>}
            </Link>
          )}
          {!user && (
            <>
              <Link to="/login" className="btn btn-soft d-none d-sm-inline-block">Log in</Link>
              <Link to="/register" className="btn btn-primary">Join</Link>
            </>
          )}
          {user && (
            <div className="dropdown" ref={menuRef}>
              <button className="btn btn-soft d-flex align-items-center gap-2 ps-1 pe-3 py-1" onClick={() => setMenu(!menu)} aria-expanded={menu}>
                <span className="avatar">{initials(user.name)}</span>
                <span className="d-none d-md-inline">{user.name.split(' ')[0]}</span>
                <i className="bi bi-chevron-down small" />
              </button>
              {menu && (
                <div className="dropdown-menu dropdown-menu-end show" style={{ right: 0, left: 'auto', minWidth: 210 }}>
                  {user.role === 'consumer' ? (
                    <>
                      <Link className="dropdown-item" to="/my-orders"><i className="bi bi-receipt me-2" />My orders</Link>
                      <Link className="dropdown-item" to="/profile"><i className="bi bi-person me-2" />My profile</Link>
                    </>
                  ) : (
                    <Link className="dropdown-item" to={homeFor(user)}><i className="bi bi-grid me-2" />Go to dashboard</Link>
                  )}
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item" onClick={doLogout}><i className="bi bi-box-arrow-right me-2" />Log out</button>
                </div>
              )}
            </div>
          )}
          <button className="navbar-toggler border-0 px-2" onClick={() => setOpen(!open)} aria-label="Menu">
            <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'} fs-3`} />
          </button>
        </div>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto gap-lg-1 py-3 py-lg-0">
            <li className="nav-item"><NavLink end to="/" className="nav-link">Home</NavLink></li>
            <li className="nav-item"><NavLink to="/shop" className="nav-link">Shop</NavLink></li>
            {user?.role === 'consumer' && <li className="nav-item"><NavLink to="/my-orders" className="nav-link">My Orders</NavLink></li>}
            <li className="nav-item"><NavLink to="/about" className="nav-link">About</NavLink></li>
            <li className="nav-item"><NavLink to="/contact" className="nav-link">Contact</NavLink></li>
            {user && user.role !== 'consumer' && (
              <li className="nav-item"><NavLink to={homeFor(user)} className="nav-link">Dashboard</NavLink></li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="ff-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <Link to="/" className="ff-brand mb-3"><img src={asset('favicon.svg')} alt="" /> Farmer's Fresh</Link>
            <p className="mt-3" style={{ maxWidth: 320 }}>
              Fresh produce straight from local farmers to your kitchen. Fair prices for farmers, fresher food for families.
            </p>
          </div>
          <div className="col-6 col-lg-2">
            <h6>Shop</h6>
            <Link to="/shop?category=Vegetables">Vegetables</Link>
            <Link to="/shop?category=Fruits">Fruits</Link>
            <Link to="/shop?category=Grains%20%26%20Pulses">Grains & Pulses</Link>
            <Link to="/shop?category=Dairy%20%26%20More">Dairy & More</Link>
          </div>
          <div className="col-6 col-lg-2">
            <h6>Company</h6>
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/register?role=farmer">Sell as a farmer</Link>
            <Link to="/credits">Photo credits</Link>
          </div>
          <div className="col-lg-4">
            <h6>Reach us</h6>
            <p className="mb-1"><i className="bi bi-geo-alt me-2" />Chennai, Tamil Nadu</p>
            <p className="mb-1"><i className="bi bi-telephone me-2" />+91 90000 00000</p>
            <p className="mb-0"><i className="bi bi-envelope me-2" />hello@farmersfresh.in</p>
          </div>
        </div>
        <div className="ff-footer-bottom d-flex flex-wrap justify-content-between gap-2">
          <span>© {new Date().getFullYear()} Farmer's Fresh. Made for local farmers.</span>
          <span>Web Programming Project · CS23531</span>
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <>
      <Navbar />
      <main><Outlet /></main>
      <Footer />
    </>
  )
}
