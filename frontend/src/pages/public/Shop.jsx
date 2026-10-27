import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import ProductCard from '../../components/ProductCard'
import { EmptyState, ErrorBox, Loader, useApi, useTitle } from '../../components/ui'

const SORTS = { new: 'Newest first', price_asc: 'Price: low to high', price_desc: 'Price: high to low', rating: 'Top rated', name: 'Name A–Z' }

export default function Shop() {
  useTitle('Shop')
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const [showFilters, setShowFilters] = useState(false)
  const meta = useApi(() => api.get('products', 'meta'))

  const filters = {
    q: params.get('q') || '', category: params.get('category') || '', district: params.get('district') || '',
    sort: params.get('sort') || 'new', organic: params.get('organic') || '', max: params.get('max') || '',
    farmer: params.get('farmer') || '', in_stock: params.get('in_stock') || '',
  }
  const key = JSON.stringify(filters)
  const list = useApi(() => api.get('products', 'list', filters), [key])

  const set = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v); else next.delete(k)
    setParams(next, { replace: true })
  }

  // search as you type (short delay)
  useEffect(() => {
    const t = setTimeout(() => { if (search !== filters.q) set('q', search.trim()) }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const farmerName = filters.farmer && meta.data?.farmers.find((f) => String(f.id) === filters.farmer)?.farm_name
  const active = ['category', 'district', 'organic', 'max', 'farmer', 'in_stock', 'q'].some((k) => filters[k])

  return (
    <>
      <div className="ff-page-head">
        <div className="container">
          <h1>{farmerName ? farmerName : filters.category || 'Fresh from local farms'}</h1>
          <p>{farmerName ? 'Everything this farm is selling right now.' : 'Every item is listed by the farmer who grew it. Prices are set by them, not middlemen.'}</p>
        </div>
      </div>

      <div className="container py-4 py-lg-5">
        <div className="row g-4">
          {/* Filters */}
          <div className="col-lg-3">
            <button className="btn btn-soft w-100 d-lg-none" onClick={() => setShowFilters(!showFilters)}>
              <i className="bi bi-sliders me-1" /> {showFilters ? 'Hide filters' : 'Search & filters'}{active ? ' •' : ''}
            </button>
            <div className={`ff-card ff-card-pad ff-filter mt-3 mt-lg-0 ${showFilters ? '' : 'd-none d-lg-block'}`}>
              <div className="mb-4">
                <label className="form-label" htmlFor="q">Search</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-search" /></span>
                  <input id="q" className="form-control" placeholder="Tomato, mango, rice…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>

              <div className="mb-4">
                <div className="form-label">Category</div>
                <div className="d-flex flex-wrap gap-2">
                  <button className={`ff-chip ${!filters.category ? 'active' : ''}`} onClick={() => set('category', '')}>All</button>
                  {(meta.data?.categories || []).map((c) => (
                    <button key={c} className={`ff-chip ${filters.category === c ? 'active' : ''}`} onClick={() => set('category', c)}>{c}</button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="district">District</label>
                <select id="district" className="form-select" value={filters.district} onChange={(e) => set('district', e.target.value)}>
                  <option value="">All districts</option>
                  {(meta.data?.districts || []).map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="max">Max price {filters.max && <span className="text-terracotta">₹{filters.max}</span>}</label>
                <input id="max" type="range" className="form-range" min="20" max="400" step="10" value={filters.max || 400}
                  onChange={(e) => set('max', e.target.value === '400' ? '' : e.target.value)} />
              </div>

              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="org" checked={filters.organic === '1'} onChange={(e) => set('organic', e.target.checked ? '1' : '')} />
                <label className="form-check-label fw-semibold" htmlFor="org">Naturally grown only</label>
              </div>
              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="stock" checked={filters.in_stock === '1'} onChange={(e) => set('in_stock', e.target.checked ? '1' : '')} />
                <label className="form-check-label fw-semibold" htmlFor="stock">In stock only</label>
              </div>

              {active && (
                <button className="btn btn-soft btn-sm w-100 mt-2" onClick={() => { setSearch(''); setParams({}, { replace: true }) }}>
                  <i className="bi bi-x-circle me-1" /> Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="col-lg-9">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <span className="text-muted fw-semibold">{list.data ? `${list.data.length} products` : ' '}</span>
              <select className="form-select w-auto" value={filters.sort} onChange={(e) => set('sort', e.target.value === 'new' ? '' : e.target.value)} aria-label="Sort products">
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <ErrorBox error={list.error} />
            {list.loading ? <Loader /> : list.data?.length === 0 ? (
              <div className="ff-card"><EmptyState icon="search" title="Nothing matches yet" text="Try a different search or clear a filter. New harvests are added every day." /></div>
            ) : (
              <div className="row g-4">
                {(list.data || []).map((p) => (
                  <div className="col-6 col-xl-4" key={p.id}><ProductCard p={p} /></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
