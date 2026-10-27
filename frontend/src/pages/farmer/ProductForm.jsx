import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import { ErrorBox, Loader, useTitle } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { DashTitle } from '../../layouts/DashboardLayout'
import { rupees } from '../../utils'

// Add or edit a product. The farmer picks from the catalog, so the photo,
// description, benefits and season are filled in automatically.
export default function ProductForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  useTitle(editing ? 'Edit product' : 'Add product')
  const navigate = useNavigate()
  const toast = useToast()

  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ catalog_id: '', price: '', quantity: '', notes: '', is_organic: false, is_active: true, custom_image: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const c = await api.get('catalog', 'list')
        setCatalog(c)
        if (editing) {
          const mine = await api.get('products', 'mine')
          const p = mine.find((x) => String(x.id) === id)
          if (!p) throw new Error('Product not found.')
          setForm({
            catalog_id: p.catalog_id, price: Number(p.price), quantity: Number(p.quantity), notes: p.notes || '',
            is_organic: Number(p.is_organic) === 1, is_active: Number(p.is_active) === 1,
            custom_image: c.find((x) => x.id === p.catalog_id)?.image_url !== p.image ? p.image : '',
          })
        }
      } catch (e) { setError(e.message) } finally { setLoading(false) }
    }
    load()
  }, [id, editing])

  const chosen = catalog.find((c) => String(c.id) === String(form.catalog_id))
  const cats = ['All', ...new Set(catalog.map((c) => c.category))]
  const shown = useMemo(() => catalog.filter((c) =>
    (cat === 'All' || c.category === cat) && c.name.toLowerCase().includes(search.toLowerCase())), [catalog, cat, search])

  const pick = (c) => setForm((f) => ({ ...f, catalog_id: c.id, price: f.price || Number(c.typical_price) }))

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast('Image must be smaller than 2 MB', 'error')
    const fd = new FormData()
    fd.append('image', file)
    setUploading(true)
    try { const d = await api.upload('products', 'upload', fd); setForm((f) => ({ ...f, custom_image: d.url })); toast('Photo uploaded') }
    catch (err) { toast(err.message, 'error') } finally { setUploading(false); e.target.value = '' }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.catalog_id) return setError('Please choose what you are selling from the list.')
    if (!(Number(form.price) > 0)) return setError('Please enter a price greater than zero.')
    if (form.quantity === '' || Number(form.quantity) < 0) return setError('Please enter the quantity you have available.')
    setBusy(true)
    try {
      await api.post('products', 'save', { ...form, id: id || 0 })
      toast(editing ? 'Product updated' : `${chosen.name} is now listed in the shop`)
      navigate('/farmer/products')
    } catch (err) { setError(err.message); setBusy(false) }
  }

  if (loading) return <Loader />

  return (
    <>
      <DashTitle title={editing ? 'Edit product' : 'Add a product'} subtitle={editing ? 'Change the price, stock or details.' : 'Pick what you are selling — the photo and description are added for you.'}
        action={<Link to="/farmer/products" className="btn btn-soft"><i className="bi bi-arrow-left me-1" /> Back</Link>} />
      <form className="row g-4" onSubmit={submit} noValidate>
        <div className="col-xl-7">
          <div className="ff-card ff-card-pad mb-4">
            <h5 className="serif mb-3">1. What are you selling?</h5>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {cats.map((c) => <button type="button" key={c} className={`ff-chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
            </div>
            <input className="form-control mb-3" placeholder="Search e.g. carrot" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="ff-pick-grid">
              {shown.map((c) => (
                <button type="button" key={c.id} className={`ff-pick ${String(form.catalog_id) === String(c.id) ? 'active' : ''}`} onClick={() => pick(c)}>
                  <img src={c.image_url} alt="" /><span>{c.name}</span>
                </button>
              ))}
              {shown.length === 0 && <p className="text-muted small">No match. Try another name.</p>}
            </div>
          </div>

          <div className="ff-card ff-card-pad">
            <h5 className="serif mb-3">2. Price and stock</h5>
            <ErrorBox error={error} />
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label" htmlFor="f-price">Your price {chosen && <span className="text-muted fw-normal">per {chosen.unit}</span>}</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input id="f-price" type="number" min="1" step="0.5" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                {chosen && <div className="form-text">Typical market price: {rupees(chosen.typical_price)}</div>}
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="f-qty">Quantity available</label>
                <div className="input-group">
                  <input id="f-qty" type="number" min="0" step="1" className="form-control" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  <span className="input-group-text">{chosen?.unit || 'units'}</span>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="f-notes">Note for buyers <span className="text-muted fw-normal">(optional)</span></label>
                <input id="f-notes" className="form-control" maxLength="255" placeholder="e.g. Harvested every morning, no chemical sprays" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="col-sm-6">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="f-org" checked={form.is_organic} onChange={(e) => setForm({ ...form, is_organic: e.target.checked })} />
                  <label className="form-check-label fw-semibold" htmlFor="f-org">Naturally grown (no chemicals)</label>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="f-act" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  <label className="form-check-label fw-semibold" htmlFor="f-act">Show in shop</label>
                </div>
              </div>
              <div className="col-12">
                <div className="form-label">Your own photo <span className="text-muted fw-normal">(optional — otherwise the catalog photo is used)</span></div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <label className="btn btn-soft mb-0">
                    <i className="bi bi-camera me-1" /> {uploading ? 'Uploading…' : 'Upload photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="d-none" onChange={upload} disabled={uploading} />
                  </label>
                  {form.custom_image && <button type="button" className="btn btn-link text-muted" onClick={() => setForm({ ...form, custom_image: '' })}>Use catalog photo instead</button>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="ff-card overflow-hidden" style={{ position: 'sticky', top: 90 }}>
            {chosen ? (
              <>
                <img src={form.custom_image || chosen.image_url} alt={chosen.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                <div className="ff-card-pad">
                  <span className="small-caps text-olive">{chosen.category} · Preview</span>
                  <h3 className="mt-1">{chosen.name}</h3>
                  <div className="ff-price mb-2">{form.price ? rupees(form.price) : '₹—'} <small>/ {chosen.unit}</small></div>
                  <p className="text-muted">{chosen.description}</p>
                  <div className="ff-info-row"><i className="bi bi-heart-pulse" /><div className="small"><strong>Benefits:</strong> {chosen.benefits}</div></div>
                  <div className="ff-info-row"><i className="bi bi-calendar3" /><div className="small"><strong>Season:</strong> {chosen.season}</div></div>
                  <button className="btn btn-primary btn-lg w-100 mt-3" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'List this product'}</button>
                </div>
              </>
            ) : (
              <div className="ff-empty"><div className="ff-empty-icon"><i className="bi bi-hand-index" /></div><h5>Choose a product</h5><p className="text-muted mb-0">Its photo and description will appear here.</p></div>
            )}
          </div>
        </div>
      </form>
    </>
  )
}
