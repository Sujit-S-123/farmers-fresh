import { asset } from '../api'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils'

const MENUS = {
  farmer: [
    { to: '/farmer', icon: 'grid-1x2', label: 'Dashboard', end: true },
    { to: '/farmer/products', icon: 'basket', label: 'My Products' },
    { to: '/farmer/products/new', icon: 'plus-circle', label: 'Add Product' },
    { to: '/farmer/orders', icon: 'receipt', label: 'Orders Received' },
    { to: '/farmer/profile', icon: 'person', label: 'Farm Profile' },
  ],
  admin: [
    { to: '/admin', icon: 'grid-1x2', label: 'Overview', end: true },
    { to: '/admin/farmers', icon: 'people', label: 'Farmers' },
    { to: '/admin/consumers', icon: 'person-hearts', label: 'Consumers' },
    { to: '/admin/products', icon: 'basket', label: 'Products' },
    { to: '/admin/orders', icon: 'receipt', label: 'All Orders' },
    { to: '/admin/messages', icon: 'envelope', label: 'Messages' },
  ],
}

// Sidebar layout shared by the Farmer and Admin sections
export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [location.pathname])

  return (
    <div className="ff-dash">
      {open && <div className="ff-backdrop d-lg-none" onClick={() => setOpen(false)} />}
      <aside className={`ff-sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="ff-brand"><img src={asset('favicon.svg')} alt="" /> Farmer's <span>Fresh</span></Link>
        <div className="ff-role-tag">
          <span className={`ff-pill ${role === 'admin' ? 'tone-terracotta' : ''}`}>
            <i className={`bi ${role === 'admin' ? 'bi-shield-check' : 'bi-flower1'}`} />
            {role === 'admin' ? 'Admin panel' : 'Farmer panel'}
          </span>
        </div>
        <nav>
          {MENUS[role].map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end || m.to.endsWith('/products')} className="ff-side-link">
              <i className={`bi bi-${m.icon}`} /> {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-4">
          <Link to="/shop" className="ff-side-link"><i className="bi bi-shop" /> View shop</Link>
          <button className="ff-side-link border-0 bg-transparent w-100" onClick={async () => { await logout(); navigate('/') }}>
            <i className="bi bi-box-arrow-right" /> Log out
          </button>
        </div>
      </aside>

      <div className="ff-dash-main">
        <div className="ff-dash-top">
          <button className="btn btn-soft btn-icon d-lg-none" onClick={() => setOpen(true)} aria-label="Open menu"><i className="bi bi-list" /></button>
          <div className="text-muted fw-semibold d-none d-sm-block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <div className="text-end lh-sm">
              <div className="fw-bold">{user?.name}</div>
              <div className="small text-muted">{role === 'farmer' ? user?.farm_name || 'Farmer' : 'Administrator'}</div>
            </div>
            <span className={`avatar ${role === 'farmer' ? 'olive' : ''}`}>{initials(user?.name)}</span>
          </div>
        </div>
        <div className="ff-dash-body">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function DashTitle({ title, subtitle, action }) {
  return (
    <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
      <div className="ff-dash-title"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {action}
    </div>
  )
}
