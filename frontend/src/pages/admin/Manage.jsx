// Admin management pages: farmers, consumers, products, orders, messages
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { EmptyState, ErrorBox, Loader, StatusBadge, useApi, useTitle } from '../../components/ui'
import { useConfirm, useToast } from '../../context/ToastContext'
import { DashTitle } from '../../layouts/DashboardLayout'
import { dateShort, dateTime, initials, qty, rupees } from '../../utils'

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="input-group" style={{ maxWidth: 320 }}>
      <span className="input-group-text"><i className="bi bi-search" /></span>
      <input className="form-control" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

const match = (q, ...fields) => fields.join(' ').toLowerCase().includes(q.toLowerCase())

export function AdminUsers({ role }) {
  const farmers = role === 'farmer'
  useTitle(farmers ? 'Farmers' : 'Consumers')
  const { data, loading, error, reload } = useApi(() => api.get('admin', 'users', { role }), [role])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const toast = useToast()
  const confirm = useConfirm()

  const approve = async (u, approved) => {
    try { await api.post('admin', 'approve', { id: u.id, approved }); toast(approved ? `${u.farm_name || u.name} approved` : 'Approval removed'); reload() } catch (e) { toast(e.message, 'error') }
  }
  const block = async (u) => {
    if (Number(u.is_active) && !(await confirm(`Block ${u.name}? They will not be able to log in.`, 'Block'))) return
    try { await api.post('admin', 'toggle_user', { id: u.id }); toast(Number(u.is_active) ? `${u.name} blocked` : `${u.name} unblocked`); reload() } catch (e) { toast(e.message, 'error') }
  }

  const list = (data || []).filter((u) =>
    match(q, u.name, u.email, u.farm_name, u.district) &&
    (filter === 'all' || (filter === 'pending' ? !Number(u.is_approved) : filter === 'blocked' ? !Number(u.is_active) : Number(u.is_approved) && Number(u.is_active))))
  const pending = (data || []).filter((u) => !Number(u.is_approved)).length

  return (
    <>
      <DashTitle title={farmers ? 'Farmers' : 'Consumers'} subtitle={farmers ? 'Approve new farms and manage existing ones.' : 'Everyone who shops on Farmer\'s Fresh.'} />
      <ErrorBox error={error} />
      {loading ? <Loader /> : (
        <div className="ff-card overflow-hidden">
          <div className="p-3 border-bottom d-flex flex-wrap gap-2 align-items-center justify-content-between">
            <SearchBox value={q} onChange={setQ} placeholder="Search name, email, district" />
            <div className="d-flex gap-2 flex-wrap">
              {(farmers ? [['all', 'All'], ['pending', `Pending (${pending})`], ['active', 'Approved'], ['blocked', 'Blocked']] : [['all', 'All'], ['active', 'Active'], ['blocked', 'Blocked']]).map(([k, l]) => (
                <button key={k} className={`ff-chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
          </div>
          {list.length === 0 ? <EmptyState icon="people" title="No one here" text="Try another filter." /> : (
            <div className="table-responsive">
              <table className="table ff-table">
                <thead><tr><th>{farmers ? 'Farmer' : 'Name'}</th><th>Contact</th><th>District</th>{farmers && <th>Products</th>}<th>Orders</th><th>Joined</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`avatar ${farmers ? 'olive' : ''}`}>{initials(u.name)}</span>
                          <div><div className="fw-bold">{farmers ? u.farm_name || u.name : u.name}</div>{farmers && <div className="small text-muted">{u.name}</div>}</div>
                        </div>
                      </td>
                      <td className="small">{u.email}<div className="text-muted">{u.phone}</div></td>
                      <td>{u.village ? `${u.village}, ` : ''}{u.district}</td>
                      {farmers && <td>{u.products}</td>}
                      <td>{u.orders}</td>
                      <td className="small text-muted">{dateShort(u.created_at)}</td>
                      <td><StatusBadge status={!Number(u.is_active) ? 'Blocked' : !Number(u.is_approved) ? 'Pending' : 'Active'} /></td>
                      <td className="text-end text-nowrap">
                        {farmers && !Number(u.is_approved) && <button className="btn btn-olive btn-sm me-1" onClick={() => approve(u, 1)}><i className="bi bi-check-lg me-1" />Approve</button>}
                        {farmers && Number(u.is_approved) === 1 && <Link to={`/shop?farmer=${u.id}`} className="btn btn-soft btn-sm me-1">View shop</Link>}
                        <button className={`btn btn-sm ${Number(u.is_active) ? 'btn-light-danger' : 'btn-soft'}`} onClick={() => block(u)}>{Number(u.is_active) ? 'Block' : 'Unblock'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export function AdminProducts() {
  useTitle('All products')
  const { data, loading, error, reload } = useApi(() => api.get('admin', 'products'))
  const [q, setQ] = useState('')
  const toast = useToast()
  const confirm = useConfirm()
  const remove = async (p) => {
    if (!(await confirm(`Remove "${p.name}" by ${p.farm_name} from the marketplace?`, 'Remove'))) return
    try { await api.post('admin', 'remove_product', { id: p.id }); toast('Listing removed'); reload() } catch (e) { toast(e.message, 'error') }
  }
  const list = (data || []).filter((p) => match(q, p.name, p.farm_name, p.category, p.district))

  return (
    <>
      <DashTitle title="All products" subtitle="Every listing on the marketplace. Remove anything fake or misleading." />
      <ErrorBox error={error} />
      {loading ? <Loader /> : (
        <div className="ff-card overflow-hidden">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <SearchBox value={q} onChange={setQ} placeholder="Search product or farm" />
            <span className="text-muted small fw-semibold">{list.length} listings</span>
          </div>
          <div className="table-responsive">
            <table className="table ff-table">
              <thead><tr><th>Product</th><th>Farm</th><th>Price</th><th>Stock</th><th>Status</th><th className="text-end">Action</th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td><div className="d-flex align-items-center gap-3"><img src={p.image} alt="" className="ff-thumb" /><div><Link to={`/product/${p.id}`} className="fw-bold text-reset">{p.name}</Link><div className="small text-muted">{p.category}</div></div></div></td>
                    <td>{p.farm_name}<div className="small text-muted">{p.district}</div></td>
                    <td className="fw-bold">{rupees(p.price)}<span className="small text-muted fw-normal"> / {p.unit}</span></td>
                    <td>{qty(p.quantity)} {p.unit}</td>
                    <td><StatusBadge status={Number(p.is_active) ? 'Active' : 'Hidden'} /></td>
                    <td className="text-end"><button className="btn btn-light-danger btn-sm" onClick={() => remove(p)}><i className="bi bi-trash3 me-1" />Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

export function AdminOrders() {
  useTitle('All orders')
  const { data, loading, error } = useApi(() => api.get('admin', 'orders'))
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const list = (data || []).filter((o) => match(q, o.id, o.consumer_name, o.farm_name, o.summary) && (!status || o.status === status))

  return (
    <>
      <DashTitle title="All orders" subtitle="Every order placed on the marketplace." />
      <ErrorBox error={error} />
      {loading ? <Loader /> : (
        <div className="ff-card overflow-hidden">
          <div className="p-3 border-bottom d-flex flex-wrap gap-2 justify-content-between">
            <SearchBox value={q} onChange={setQ} placeholder="Search order, buyer or farm" />
            <select className="form-select w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {['Placed', 'Accepted', 'Packed', 'Delivered', 'Rejected', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {list.length === 0 ? <EmptyState icon="receipt" title="No orders found" /> : (
            <div className="table-responsive">
              <table className="table ff-table">
                <thead><tr><th>#</th><th>Date</th><th>Buyer</th><th>Farm</th><th>Items</th><th>Mode</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id}>
                      <td className="fw-bold">{o.id}</td>
                      <td className="small text-nowrap">{dateTime(o.created_at)}</td>
                      <td>{o.consumer_name}</td>
                      <td>{o.farm_name}</td>
                      <td className="small" style={{ maxWidth: 260 }}>{o.summary}</td>
                      <td className="small">{o.payment_mode === 'COD' ? 'Delivery' : 'Pickup'}</td>
                      <td className="fw-bold">{rupees(o.total)}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export function AdminMessages() {
  useTitle('Messages')
  const { data, loading, error, reload } = useApi(() => api.get('admin', 'messages'))
  const toast = useToast()
  const confirm = useConfirm()
  const del = async (m) => {
    try { await api.post('admin', 'delete_message', { id: m.id }); toast('Message deleted'); reload() } catch (e) { toast(e.message, 'error') }
  }
  return (
    <>
      <DashTitle title="Messages" subtitle="Questions sent through the contact form." />
      <ErrorBox error={error} />
      {loading ? <Loader /> : !data?.length ? <div className="ff-card"><EmptyState icon="envelope-open" title="Inbox is empty" /></div> : (
        <div className="row g-3">
          {data.map((m) => (
            <div className="col-lg-6" key={m.id}>
              <div className="ff-card ff-card-pad h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="avatar mustard">{initials(m.name)}</span>
                  <div className="flex-grow-1"><div className="fw-bold">{m.name}</div><a href={`mailto:${m.email}`} className="small">{m.email}</a></div>
                  <span className="small text-muted">{dateTime(m.created_at)}</span>
                </div>
                <p className="mb-3">{m.message}</p>
                <div className="d-flex gap-2">
                  <a href={`mailto:${m.email}?subject=Re: your message to Farmer's Fresh`} className="btn btn-soft btn-sm"><i className="bi bi-reply me-1" />Reply</a>
                  <button className="btn btn-light-danger btn-sm" onClick={() => del(m)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
