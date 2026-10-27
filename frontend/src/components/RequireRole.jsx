import { Navigate, useLocation } from 'react-router-dom'
import { homeFor, useAuth } from '../context/AuthContext'
import { Loader } from './ui'

// Protects pages so each role only sees its own section
export default function RequireRole({ role, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />
  if (role === 'farmer' && !Number(user.is_approved)) return <Navigate to="/pending-approval" replace />
  return children
}
