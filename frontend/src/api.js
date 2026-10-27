// Small wrapper around fetch for the PHP backend.
// Every response looks like { ok: true, data } or { ok: false, error }.
const BASE = '/api'
// The online demo build (npm run build:demo) runs without PHP: requests go to an in-browser copy of the API
export const DEMO = import.meta.env.VITE_DEMO === '1' || import.meta.env.MODE === 'demo'

async function request(path, { method = 'GET', body, form } = {}) {
  const opts = { method, credentials: 'include', headers: {} }
  if (form) {
    opts.body = form // multipart upload — browser sets the header
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  let res
  try {
    res = await fetch(BASE + path, opts)
  } catch {
    throw new Error('Cannot reach the server. Is XAMPP (Apache + MySQL) running?')
  }
  let json
  try {
    json = await res.json()
  } catch {
    throw new Error('The server sent an unexpected reply. Check that the backend folder is in htdocs.')
  }
  if (!json.ok) {
    const err = new Error(json.error || 'Something went wrong.')
    err.status = res.status
    throw err
  }
  return json.data
}

const qs = (params = {}) => {
  const p = Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null && v !== false)
  return p.length ? '&' + new URLSearchParams(p).toString() : ''
}

// loaded only in the demo build
const demoCall = async (file, action, opts) => (await import('./demo/mockApi')).mockRequest(file, action, opts)

export const api = DEMO ? {
  get: (file, action, params = {}) => demoCall(file, action, { query: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v === undefined || v === null || v === false ? '' : String(v)])) }),
  post: (file, action, body = {}) => demoCall(file, action, { body }),
  upload: (file, action, formData) => demoCall(file, action, { form: formData }),
} : {
  get: (file, action, params) => request(`/${file}.php?action=${action}${qs(params)}`),
  post: (file, action, body = {}) => request(`/${file}.php?action=${action}`, { method: 'POST', body }),
  upload: (file, action, formData) => request(`/${file}.php?action=${action}`, { method: 'POST', form: formData }),
}

// Public file path that works both on a normal server and in the demo build
export const asset = (path) => import.meta.env.BASE_URL + path.replace(/^\//, '')
