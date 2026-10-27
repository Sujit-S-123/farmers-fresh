// Formatting helpers used across the app

export const rupees = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

// 5.00 -> "5", 2.50 -> "2.5"
export const qty = (n) => String(Number(n || 0))

// MySQL timestamps are in the server's local time (same machine with XAMPP)
const toDate = (s) => new Date(String(s).replace(' ', 'T'))

// "YYYY-MM-DD" for a local date
export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const dateShort = (s) =>
  toDate(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const dateTime = (s) =>
  toDate(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

export const unitLabel = (unit) => (unit === 'kg' ? 'kg' : unit)

export const DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode',
  'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet',
  'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar',
]

export const CATEGORIES = [
  { name: 'Vegetables', icon: 'tomato', blurb: 'Picked this morning' },
  { name: 'Fruits', icon: 'mango', blurb: 'Naturally ripened' },
  { name: 'Grains & Pulses', icon: 'ponni-rice', blurb: 'Stone-cleaned & unpolished' },
  { name: 'Dairy & More', icon: 'honey', blurb: 'Milk, eggs, honey, jaggery' },
]

export const ORDER_STEPS = ['Placed', 'Accepted', 'Packed', 'Delivered']
