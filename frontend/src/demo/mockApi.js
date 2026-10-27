// In-browser stand-in for the PHP backend, used only by the online demo build
// (npm run build:demo). It answers the same actions as backend/api/*.php,
// keeps data in localStorage, and starts from the same demo data as the SQL file.
import seed from './seed.json'

const KEY = 'ff_demo_db_v3'
const pad = (n) => String(n).padStart(2, '0')
const stamp = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

function fresh() {
  const now = Date.now()
  const db = {}
  for (const [table, rows] of Object.entries(seed)) {
    db[table] = rows.map(({ ago, ...r }) => (ago !== undefined ? { ...r, created_at: stamp(new Date(now - ago * 1000)) } : { ...r }))
  }
  db.session = null
  return db
}

let db
try { db = JSON.parse(localStorage.getItem(KEY)) } catch { db = null }
if (!db) db = fresh()
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* storage blocked: keep in memory */ } }

export function resetDemo() { db = fresh(); save() }

class ApiError extends Error {}
const fail = (msg) => { throw new ApiError(msg) }
const nextId = (t) => Math.max(0, ...db[t].map((r) => r.id)) + 1
const phoneOk = (p) => /^[6-9]\d{9}$/.test(p || '')
const round1 = (n) => Math.round(n * 10) / 10
const dayOf = (s) => s.slice(0, 10)
const daysAgo = (s) => (Date.now() - new Date(s.replace(' ', 'T')).getTime()) / 86400000

const publicUser = (u) => {
  if (!u) return null
  const { password, ...rest } = u
  return rest
}
const me = () => {
  const u = db.users.find((x) => x.id === db.session)
  return u && u.is_active ? u : null
}
function requireRole(...roles) {
  const u = me()
  if (!u) fail('Please log in to continue.')
  if (roles.length && !roles.includes(u.role)) fail('You do not have access to this page.')
  if (u.role === 'farmer' && !u.is_approved && roles.includes('farmer')) fail('Your farmer account is waiting for admin approval.')
  return u
}

// Same shape as PRODUCT_SELECT in products.php
function view(p) {
  const c = db.catalog.find((x) => x.id === p.catalog_id)
  const u = db.users.find((x) => x.id === p.farmer_id)
  const rs = db.reviews.filter((r) => r.product_id === p.id)
  return {
    id: p.id, farmer_id: p.farmer_id, catalog_id: p.catalog_id, price: p.price, quantity: p.quantity,
    is_organic: p.is_organic, is_active: p.is_active, notes: p.notes, created_at: p.created_at,
    name: c.name, slug: c.slug, category: c.category, unit: c.unit, season: c.season, description: c.description,
    benefits: c.benefits, typical_price: c.typical_price, image: p.custom_image || c.image_url,
    farmer_name: u.name, farm_name: u.farm_name, village: u.village, district: u.district,
    rating: rs.length ? round1(rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1) : null,
    review_count: rs.length,
  }
}
const visible = (p) => {
  const u = db.users.find((x) => x.id === p.farmer_id)
  return p.is_active && !p.is_deleted && u.is_active && u.is_approved
}
const byNewest = (a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : b.id - a.id)

function withItems(orders) {
  return orders.map((o) => ({
    ...o,
    items: db.order_items.filter((i) => i.order_id === o.id).map((i) => {
      const p = db.products.find((x) => x.id === i.product_id)
      const c = db.catalog.find((x) => x.id === p.catalog_id)
      return { ...i, unit: c.unit, image: p.custom_image || c.image_url }
    }),
  }))
}
function restoreStock(orderId) {
  db.order_items.filter((i) => i.order_id === orderId).forEach((i) => {
    const p = db.products.find((x) => x.id === i.product_id)
    if (p) p.quantity += i.quantity
  })
}
const deliveredFor = (consumerId, productId) => db.orders.some((o) => o.consumer_id === consumerId && o.status === 'Delivered' &&
  db.order_items.some((i) => i.order_id === o.id && i.product_id === productId))

const handlers = {
  auth: {
    me: () => ({ user: publicUser(me()) }),
    register: (b) => {
      const email = (b.email || '').trim().toLowerCase()
      if ((b.name || '').trim().length < 2) fail('Please enter your full name.')
      if (!/^\S+@\S+\.\S+$/.test(email)) fail('Please enter a valid email address.')
      if ((b.password || '').length < 6) fail('Password must be at least 6 characters.')
      if (!phoneOk(b.phone)) fail('Please enter a valid 10-digit mobile number.')
      if (!['consumer', 'farmer'].includes(b.role)) fail('Please choose Farmer or Consumer.')
      if (!b.district) fail('Please select your district.')
      if (db.users.some((u) => u.email === email)) fail('An account with this email already exists. Please log in.')
      const u = {
        id: nextId('users'), name: b.name.trim(), email, password: b.password, role: b.role, phone: b.phone,
        district: b.district, village: b.village || null, address: b.address || null, farm_name: b.farm_name || null,
        is_approved: b.role === 'farmer' ? 0 : 1, is_active: 1, created_at: stamp(),
      }
      db.users.push(u)
      db.session = u.id
      return { user: publicUser(u) }
    },
    login: (b) => {
      const u = db.users.find((x) => x.email === (b.email || '').trim().toLowerCase())
      if (!u || u.password !== b.password) fail('Incorrect email or password.')
      if (!u.is_active) fail('This account has been blocked. Please contact support.')
      db.session = u.id
      return { user: publicUser(u) }
    },
    logout: () => { db.session = null; return [] },
    update_profile: (b) => {
      const u = requireRole()
      if ((b.name || '').trim().length < 2) fail('Please enter your full name.')
      if (!phoneOk(b.phone)) fail('Please enter a valid 10-digit mobile number.')
      Object.assign(u, { name: b.name.trim(), phone: b.phone, district: b.district || u.district, village: b.village || null, address: b.address || null, farm_name: b.farm_name || null })
      return { user: publicUser(u) }
    },
    change_password: (b) => {
      const u = requireRole()
      if (u.password !== b.current) fail('Your current password is incorrect.')
      if ((b.new || '').length < 6) fail('New password must be at least 6 characters.')
      u.password = b.new
      return []
    },
  },

  catalog: {
    list: () => {
      const order = ['Vegetables', 'Fruits', 'Grains & Pulses', 'Dairy & More']
      return [...db.catalog].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name))
    },
  },

  products: {
    list: (q) => {
      let rows = db.products.filter(visible).map(view)
      if (q.q) { const s = q.q.toLowerCase(); rows = rows.filter((p) => [p.name, p.description, p.farm_name].join(' ').toLowerCase().includes(s)) }
      if (q.category) rows = rows.filter((p) => p.category === q.category)
      if (q.district) rows = rows.filter((p) => p.district === q.district)
      if (q.min) rows = rows.filter((p) => p.price >= Number(q.min))
      if (q.max) rows = rows.filter((p) => p.price <= Number(q.max))
      if (q.organic === '1') rows = rows.filter((p) => p.is_organic)
      if (q.in_stock === '1') rows = rows.filter((p) => p.quantity > 0)
      if (q.farmer) rows = rows.filter((p) => p.farmer_id === Number(q.farmer))
      const sorts = {
        price_asc: (a, b) => a.price - b.price, price_desc: (a, b) => b.price - a.price,
        name: (a, b) => a.name.localeCompare(b.name),
        rating: (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || b.review_count - a.review_count,
      }
      rows.sort(sorts[q.sort] || byNewest)
      return rows.slice(0, Math.min(100, Number(q.limit) || 100))
    },
    get: (q) => {
      const raw = db.products.find((x) => x.id === Number(q.id) && !x.is_deleted)
      if (!raw) fail('This product is no longer available.')
      const p = view(raw)
      p.reviews = db.reviews.filter((r) => r.product_id === p.id).sort(byNewest)
        .map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at, name: db.users.find((u) => u.id === r.consumer_id)?.name }))
      p.more_from_farmer = db.products.filter((x) => visible(x) && x.farmer_id === p.farmer_id && x.id !== p.id).slice(0, 4).map(view)
      const u = me()
      p.can_review = Boolean(u && u.role === 'consumer' && deliveredFor(u.id, p.id))
      return p
    },
    meta: () => {
      const vis = db.products.filter(visible)
      const farmers = db.users.filter((u) => u.role === 'farmer' && u.is_approved && u.is_active)
      return {
        categories: ['Vegetables', 'Fruits', 'Grains & Pulses', 'Dairy & More'],
        districts: [...new Set(vis.map((p) => db.users.find((u) => u.id === p.farmer_id).district))].sort(),
        stats: {
          farmers: farmers.length, products: vis.length,
          customers: db.users.filter((u) => u.role === 'consumer').length,
          delivered: db.orders.filter((o) => o.status === 'Delivered').length,
        },
        farmers: farmers.map((u) => ({ id: u.id, name: u.name, farm_name: u.farm_name, village: u.village, district: u.district,
          products: db.products.filter((p) => p.farmer_id === u.id && p.is_active && !p.is_deleted).length })),
      }
    },
    mine: () => {
      const u = requireRole('farmer')
      return db.products.filter((p) => p.farmer_id === u.id && !p.is_deleted).map(view).sort(byNewest)
    },
    save: (b) => {
      const u = requireRole('farmer')
      const price = Number(b.price), qty = Number(b.quantity)
      if (!(price > 0) || price > 100000) fail('Please enter a valid price.')
      if (b.quantity === '' || !(qty >= 0) || qty > 100000) fail('Please enter a valid quantity.')
      if (!db.catalog.some((c) => c.id === Number(b.catalog_id))) fail('Please choose a product from the list.')
      const fields = { catalog_id: Number(b.catalog_id), price, quantity: qty, custom_image: b.custom_image || null,
        notes: (b.notes || '').slice(0, 255) || null, is_organic: b.is_organic ? 1 : 0, is_active: b.is_active ? 1 : 0 }
      const id = Number(b.id) || 0
      if (id) {
        const p = db.products.find((x) => x.id === id && x.farmer_id === u.id && !x.is_deleted)
        if (!p) fail('Product not found.')
        Object.assign(p, fields)
        return { id }
      }
      const p = { id: nextId('products'), farmer_id: u.id, is_deleted: 0, created_at: stamp(), ...fields }
      db.products.push(p)
      return { id: p.id }
    },
    toggle: (b) => {
      const u = requireRole('farmer')
      const p = db.products.find((x) => x.id === Number(b.id) && x.farmer_id === u.id && !x.is_deleted)
      if (!p) fail('Product not found.')
      p.is_active = p.is_active ? 0 : 1
      return []
    },
    delete: (b) => {
      const u = requireRole('farmer')
      const p = db.products.find((x) => x.id === Number(b.id) && x.farmer_id === u.id && !x.is_deleted)
      if (!p) fail('Product not found.')
      p.is_deleted = 1; p.is_active = 0
      return []
    },
  },

  orders: {
    place: (b) => {
      const u = requireRole('consumer')
      const items = b.items || []
      if (!items.length) fail('Your cart is empty.')
      if (!['COD', 'Pickup'].includes(b.payment_mode)) fail('Please choose a payment option.')
      if (b.payment_mode === 'COD' && (b.address || '').trim().length < 10) fail('Please enter your full delivery address.')
      if (!phoneOk(b.phone)) fail('Please enter a valid 10-digit mobile number.')
      // check everything first, then change stock (like the SQL transaction)
      const lines = items.map((it) => {
        const p = db.products.find((x) => x.id === Number(it.product_id))
        const qty = Number(it.quantity)
        if (!(qty > 0)) fail('Invalid quantity in cart.')
        if (!p || !visible(p)) fail('An item in your cart is no longer available.')
        const c = db.catalog.find((x) => x.id === p.catalog_id)
        if (p.quantity < qty) fail(`Only ${p.quantity} left of ${c.name}. Please update your cart.`)
        return { p, qty, name: c.name }
      })
      const byFarmer = {}
      lines.forEach((l) => { l.p.quantity -= l.qty; (byFarmer[l.p.farmer_id] ||= []).push(l) })
      const ids = Object.entries(byFarmer).map(([farmerId, ls]) => {
        const id = nextId('orders')
        db.orders.push({ id, consumer_id: u.id, farmer_id: Number(farmerId), total: ls.reduce((s, l) => s + l.qty * l.p.price, 0),
          payment_mode: b.payment_mode, delivery_address: b.address || null, phone: b.phone, status: 'Placed', created_at: stamp() })
        ls.forEach((l) => db.order_items.push({ id: nextId('order_items'), order_id: id, product_id: l.p.id, product_name: l.name, quantity: l.qty, price: l.p.price }))
        return id
      })
      return { order_ids: ids }
    },
    mine: () => {
      const u = requireRole('consumer')
      return withItems(db.orders.filter((o) => o.consumer_id === u.id).sort(byNewest).map((o) => {
        const f = db.users.find((x) => x.id === o.farmer_id)
        return { ...o, farmer_name: f.name, farm_name: f.farm_name, farmer_phone: f.phone, village: f.village, district: f.district }
      }))
    },
    cancel: (b) => {
      const u = requireRole('consumer')
      const o = db.orders.find((x) => x.id === Number(b.id) && x.consumer_id === u.id && x.status === 'Placed')
      if (!o) fail('This order can no longer be cancelled.')
      o.status = 'Cancelled'
      restoreStock(o.id)
      return []
    },
    farmer: () => {
      const u = requireRole('farmer')
      const rank = ['Placed', 'Accepted', 'Packed', 'Delivered', 'Rejected', 'Cancelled']
      return withItems(db.orders.filter((o) => o.farmer_id === u.id)
        .sort((a, b) => rank.indexOf(a.status) - rank.indexOf(b.status) || byNewest(a, b))
        .map((o) => ({ ...o, consumer_name: db.users.find((x) => x.id === o.consumer_id).name })))
    },
    update_status: (b) => {
      const u = requireRole('farmer')
      const allowed = { Placed: ['Accepted', 'Rejected'], Accepted: ['Packed'], Packed: ['Delivered'] }
      const o = db.orders.find((x) => x.id === Number(b.id) && x.farmer_id === u.id)
      if (!o) fail('Order not found.')
      if (!(allowed[o.status] || []).includes(b.status)) fail(`An order that is ${o.status} cannot be marked ${b.status}.`)
      o.status = b.status
      if (b.status === 'Rejected') restoreStock(o.id)
      return []
    },
  },

  reviews: {
    add: (b) => {
      const u = requireRole('consumer')
      const rating = Number(b.rating), pid = Number(b.product_id)
      if (!(rating >= 1 && rating <= 5)) fail('Please choose a rating from 1 to 5 stars.')
      if (!deliveredFor(u.id, pid)) fail('You can review a product after it has been delivered to you.')
      const existing = db.reviews.find((r) => r.product_id === pid && r.consumer_id === u.id)
      const fields = { rating, comment: (b.comment || '').slice(0, 500) || null, created_at: stamp() }
      if (existing) Object.assign(existing, fields)
      else db.reviews.push({ id: nextId('reviews'), product_id: pid, consumer_id: u.id, ...fields })
      return []
    },
  },

  contact: {
    send: (b) => {
      if ((b.name || '').trim().length < 2) fail('Please enter your name.')
      if (!/^\S+@\S+\.\S+$/.test(b.email || '')) fail('Please enter a valid email address.')
      if ((b.message || '').trim().length < 10) fail('Please write a slightly longer message.')
      db.messages.push({ id: nextId('messages'), name: b.name.trim(), email: b.email.trim(), message: b.message.trim().slice(0, 2000), created_at: stamp() })
      return []
    },
  },

  farmer: {
    stats: () => {
      const u = requireRole('farmer')
      const os = db.orders.filter((o) => o.farmer_id === u.id)
      const live = os.filter((o) => !['Rejected', 'Cancelled'].includes(o.status))
      const sum = (arr) => arr.reduce((s, o) => s + o.total, 0)
      const mine = db.products.filter((p) => p.farmer_id === u.id && !p.is_deleted)
      const rs = db.reviews.filter((r) => mine.some((p) => p.id === r.product_id))
      const last7 = {}
      live.filter((o) => daysAgo(o.created_at) < 7).forEach((o) => { last7[dayOf(o.created_at)] = (last7[dayOf(o.created_at)] || 0) + o.total })
      const top = {}
      db.order_items.filter((i) => live.some((o) => o.id === i.order_id)).forEach((i) => {
        top[i.product_name] ||= { name: i.product_name, qty: 0, revenue: 0 }
        top[i.product_name].qty += i.quantity
        top[i.product_name].revenue += i.quantity * i.price
      })
      return {
        earnings: sum(os.filter((o) => o.status === 'Delivered')),
        pending_value: sum(os.filter((o) => ['Placed', 'Accepted', 'Packed'].includes(o.status))),
        new_orders: os.filter((o) => o.status === 'Placed').length,
        active_orders: os.filter((o) => ['Accepted', 'Packed'].includes(o.status)).length,
        delivered: os.filter((o) => o.status === 'Delivered').length,
        products: mine.length,
        rating: rs.length ? round1(rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1) : null,
        low_stock: mine.filter((p) => p.is_active && p.quantity < 30).sort((a, b) => a.quantity - b.quantity).slice(0, 6)
          .map((p) => { const v = view(p); return { id: v.id, name: v.name, unit: v.unit, quantity: v.quantity, image: v.image } }),
        last7: Object.entries(last7).map(([day, total]) => ({ day, total })),
        top: Object.values(top).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      }
    },
  },

  admin: {
    stats: () => {
      requireRole('admin')
      const count = (arr, key) => Object.entries(arr.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {}))
      const live = db.products.filter((p) => !p.is_deleted)
      const last7 = {}
      db.orders.filter((o) => daysAgo(o.created_at) < 7).forEach((o) => {
        const d = dayOf(o.created_at); last7[d] ||= { day: d, orders: 0, total: 0 }
        last7[d].orders += 1; last7[d].total += o.total
      })
      return {
        farmers: db.users.filter((u) => u.role === 'farmer' && u.is_approved).length,
        pending_farmers: db.users.filter((u) => u.role === 'farmer' && !u.is_approved).length,
        consumers: db.users.filter((u) => u.role === 'consumer').length,
        products: live.length,
        orders: db.orders.length,
        revenue: db.orders.filter((o) => o.status === 'Delivered').reduce((s, o) => s + o.total, 0),
        messages: db.messages.length,
        by_status: count(db.orders, 'status').map(([status, n]) => ({ status, count: n })),
        by_category: count(live.map((p) => ({ category: db.catalog.find((c) => c.id === p.catalog_id).category })), 'category').map(([category, n]) => ({ category, count: n })),
        last7: Object.values(last7),
        recent: [...db.orders].sort(byNewest).slice(0, 6).map((o) => ({ id: o.id, total: o.total, status: o.status, created_at: o.created_at,
          consumer_name: db.users.find((u) => u.id === o.consumer_id).name, farm_name: db.users.find((u) => u.id === o.farmer_id).farm_name })),
      }
    },
    users: (q) => {
      requireRole('admin')
      return db.users.filter((u) => u.role !== 'admin' && (!q.role || u.role === q.role))
        .sort((a, b) => a.is_approved - b.is_approved || byNewest(a, b))
        .map((u) => ({ ...publicUser(u),
          products: db.products.filter((p) => p.farmer_id === u.id && !p.is_deleted).length,
          orders: db.orders.filter((o) => o.consumer_id === u.id || o.farmer_id === u.id).length }))
    },
    approve: (b) => {
      requireRole('admin')
      const u = db.users.find((x) => x.id === Number(b.id) && x.role === 'farmer')
      if (u) u.is_approved = b.approved ? 1 : 0
      return []
    },
    toggle_user: (b) => {
      requireRole('admin')
      const u = db.users.find((x) => x.id === Number(b.id) && x.role !== 'admin')
      if (u) u.is_active = u.is_active ? 0 : 1
      return []
    },
    products: () => {
      requireRole('admin')
      return db.products.filter((p) => !p.is_deleted).map(view).sort(byNewest)
    },
    remove_product: (b) => {
      requireRole('admin')
      const p = db.products.find((x) => x.id === Number(b.id))
      if (p) { p.is_deleted = 1; p.is_active = 0 }
      return []
    },
    orders: () => {
      requireRole('admin')
      return [...db.orders].sort(byNewest).map((o) => ({
        ...o,
        consumer_name: db.users.find((u) => u.id === o.consumer_id).name,
        farmer_name: db.users.find((u) => u.id === o.farmer_id).name,
        farm_name: db.users.find((u) => u.id === o.farmer_id).farm_name,
        summary: db.order_items.filter((i) => i.order_id === o.id).map((i) => `${i.product_name} × ${i.quantity}`).join(', '),
      }))
    },
    messages: () => { requireRole('admin'); return [...db.messages].sort(byNewest) },
    delete_message: (b) => { requireRole('admin'); db.messages = db.messages.filter((m) => m.id !== Number(b.id)); return [] },
  },
}

// Photo uploads become data URLs kept in the browser
const readFile = (file) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = () => reject(new ApiError('Could not read that image.'))
  r.readAsDataURL(file)
})

export async function mockRequest(file, action, { query = {}, body = {}, form } = {}) {
  await new Promise((r) => setTimeout(r, 120)) // feel like a network call
  if (file === 'products' && action === 'upload') {
    requireRole('farmer')
    const f = form.get('image')
    if (!f) fail('Please choose an image to upload.')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) fail('Only JPG, PNG or WEBP images are allowed.')
    if (f.size > 2 * 1024 * 1024) fail('Image must be smaller than 2 MB.')
    return { url: await readFile(f) }
  }
  const fn = handlers[file]?.[action]
  if (!fn) fail('Unknown action.')
  const result = fn({ ...query, ...body })
  save()
  return JSON.parse(JSON.stringify(result))
}
