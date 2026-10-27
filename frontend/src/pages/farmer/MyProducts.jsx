import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { EmptyState, ErrorBox, Loader, StatusBadge, useApi, useTitle } from '../../components/ui'
import { useConfirm, useToast } from '../../context/ToastContext'
import { DashTitle } from '../../layouts/DashboardLayout'
import { qty, rupees } from '../../utils'

export default function MyProducts() {
  useTitle('My products')
  const { data, loading, error, reload } = useApi(() => api.get('products', 'mine'))
  const [q, setQ] = useState('')
  const toast = useToast()
  const confirm = useConfirm()

  const toggle = async (p) => {
    try { await api.post('products', 'toggle', { id: p.id }); toast(Number(p.is_active) ? `${p.name} hidden from shop` : `${p.name} is live`); reload() }
    catch (e) { toast(e.message, 'error') }
  }
  const del = async (p) => {
    if (!(await confirm(`Delete ${p.name}? Buyers will no longer see it.`, 'Delete'))) return
    try { await api.post('products', 'delete', { id: p.id }); toast(`${p.name} deleted`); reload() } catch (e) { toast(e.message, 'error') }
  }

  const list = (data || []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <DashTitle title="My products" subtitle="Update prices and stock, or hide items you don't have right now."
        action={<Link to="/farmer/products/new" className="btn btn-primary"><i className="bi bi-plus-lg me-1" /> Add product</Link>} />
      <ErrorBox error={error} />
      {loading ? <Loader /> : !data?.length ? (
        <div className="ff-card"><EmptyState icon="basket" title="No products yet" text="Add your first product — pick it from our catalog and the photo and description are filled in for you."
          action={<Link to="/farmer/products/new" className="btn btn-primary">Add your first product</Link>} /></div>
      ) : (
        <div className="ff-card overflow-hidden">
          <div className="p-3 border-bottom">
            <div className="input-group" style={{ maxWidth: 320 }}>
              <span className="input-group-text"><i className="bi bi-search" /></span>
              <input className="form-control" placeholder="Search your products" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table ff-table">
              <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Rating</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img src={p.image} alt="" className="ff-thumb" />
                        <div>
                          <Link to={`/product/${p.id}`} className="fw-bold text-reset">{p.name}</Link>
                          <div className="small text-muted">{p.category}{Number(p.is_organic) ? ' · Natural' : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="fw-bold">{rupees(p.price)}<span className="text-muted fw-normal small"> / {p.unit}</span></td>
                    <td><span className={Number(p.quantity) < 30 ? 'text-terracotta fw-bold' : ''}>{qty(p.quantity)} {p.unit}</span></td>
                    <td className="small">{p.rating ? <><span className="text-mustard">★</span> {p.rating} ({p.review_count})</> : <span className="text-muted">—</span>}</td>
                    <td><StatusBadge status={Number(p.is_active) ? 'Active' : 'Hidden'} /></td>
                    <td className="text-end text-nowrap">
                      <Link to={`/farmer/products/${p.id}/edit`} className="btn btn-soft btn-sm me-1"><i className="bi bi-pencil" /> Edit</Link>
                      <button className="btn btn-soft btn-sm btn-icon me-1" onClick={() => toggle(p)} title={Number(p.is_active) ? 'Hide from shop' : 'Show in shop'}>
                        <i className={`bi ${Number(p.is_active) ? 'bi-eye-slash' : 'bi-eye'}`} />
                      </button>
                      <button className="btn btn-light-danger btn-sm btn-icon" onClick={() => del(p)} title="Delete"><i className="bi bi-trash3" /></button>
                    </td>
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
