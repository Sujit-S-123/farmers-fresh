import { Route, Routes } from 'react-router-dom'
import RequireRole from './components/RequireRole'
import DashboardLayout from './layouts/DashboardLayout'
import PublicLayout from './layouts/PublicLayout'

// Public pages
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Credits from './pages/public/Credits'
import Home from './pages/public/Home'
import Login from './pages/public/Login'
import { NotFound, PendingApproval } from './pages/public/Misc'
import ProductDetails from './pages/public/ProductDetails'
import Register from './pages/public/Register'
import Shop from './pages/public/Shop'
// Consumer pages
import Cart from './pages/consumer/Cart'
import Checkout from './pages/consumer/Checkout'
import MyOrders from './pages/consumer/MyOrders'
import Profile from './pages/shared/Profile'
// Farmer pages
import FarmerDashboard from './pages/farmer/Dashboard'
import MyProducts from './pages/farmer/MyProducts'
import FarmerOrders from './pages/farmer/Orders'
import ProductForm from './pages/farmer/ProductForm'
// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import { AdminMessages, AdminOrders, AdminProducts, AdminUsers } from './pages/admin/Manage'

export default function App() {
  return (
    <Routes>
      {/* Visitors + consumers share the main site layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<RequireRole role="consumer"><Checkout /></RequireRole>} />
        <Route path="/my-orders" element={<RequireRole role="consumer"><MyOrders /></RequireRole>} />
        <Route path="/profile" element={<RequireRole role="consumer"><Profile /></RequireRole>} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Farmer section */}
      <Route path="/farmer" element={<RequireRole role="farmer"><DashboardLayout role="farmer" /></RequireRole>}>
        <Route index element={<FarmerDashboard />} />
        <Route path="products" element={<MyProducts />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="orders" element={<FarmerOrders />} />
        <Route path="profile" element={<Profile inDashboard />} />
      </Route>

      {/* Admin section */}
      <Route path="/admin" element={<RequireRole role="admin"><DashboardLayout role="admin" /></RequireRole>}>
        <Route index element={<AdminDashboard />} />
        <Route path="farmers" element={<AdminUsers role="farmer" key="farmer" />} />
        <Route path="consumers" element={<AdminUsers role="consumer" key="consumer" />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>
    </Routes>
  )
}
