import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { EmptyState, useTitle } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

// Shown to farmers whose account is waiting for admin approval
export function PendingApproval() {
  useTitle('Awaiting approval')
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'farmer' || Number(user.is_approved)) return <Navigate to={user.role === 'farmer' ? '/farmer' : '/'} replace />

  const check = async () => {
    setChecking(true)
    const d = await api.get('auth', 'me').catch(() => null)
    setChecking(false)
    if (d?.user) { setUser(d.user); if (Number(d.user.is_approved)) navigate('/farmer') }
  }

  return (
    <div className="container py-5">
      <div className="ff-card mx-auto" style={{ maxWidth: 620 }}>
        <EmptyState
          icon="hourglass-split"
          title={`Thanks for joining, ${user.name.split(' ')[0]}!`}
          text={`Your farm "${user.farm_name || 'account'}" is being reviewed by our team. Once approved you can add products and receive orders. This usually takes less than a day.`}
          action={
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-primary" onClick={check} disabled={checking}>{checking ? 'Checking…' : 'Check status'}</button>
              <button className="btn btn-soft" onClick={async () => { await logout(); navigate('/') }}>Log out</button>
            </div>
          }
        />
      </div>
    </div>
  )
}

export function NotFound() {
  useTitle('Page not found')
  return (
    <div className="container py-5">
      <EmptyState icon="signpost-split" title="This path leads nowhere" text="The page you're looking for doesn't exist. Let's get you back to the fresh stuff."
        action={<Link to="/" className="btn btn-primary">Go home</Link>} />
    </div>
  )
}
