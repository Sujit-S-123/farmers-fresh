import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const KEY = 'ff_cart'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

// Cart lives in React state and is saved to localStorage so it survives a refresh
export function CartProvider({ children }) {
  const [items, setItems] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* storage unavailable */ }
  }, [items])

  const add = (product, quantity = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id)
      const max = Number(product.quantity)
      if (found) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: Math.min(max, i.qty + quantity), stock: max } : i))
      }
      return [...prev, {
        id: product.id, name: product.name, price: Number(product.price), unit: product.unit,
        image: product.image, farm_name: product.farm_name, farmer_id: product.farmer_id,
        stock: max, qty: Math.min(max, quantity),
      }]
    })
  }

  const setQty = (id, qty) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(i.stock, qty)) } : i)))

  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id))
  const clear = () => setItems([])

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
    return { subtotal, count: items.length }
  }, [items])

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, ...totals }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
