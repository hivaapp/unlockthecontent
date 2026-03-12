import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireCreator?: boolean
}

const ProtectedRoute = ({ children, requireCreator = false }: ProtectedRouteProps) => {
  const { isLoggedIn, isLoading, currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoading) return // wait for session check to complete

    if (!isLoggedIn) {
      // Save the attempted URL so we can redirect back after auth
      navigate(`/?signIn=true&redirect=${encodeURIComponent(location.pathname)}`, {
        replace: true,
      })
      return
    }

    if (requireCreator && !currentUser?.isCreator) {
      // Viewer trying to access creator-only route
      navigate('/', { replace: true })
    }
  }, [isLoggedIn, isLoading, currentUser, requireCreator, navigate, location.pathname])

  // Show nothing while the initial session check is in progress
  // This prevents a flash of the sign-in redirect for logged-in users
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'Söhne, ui-sans-serif, system-ui, sans-serif',
        background: '#FAF9F7',
      }}>
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid #E6E2D9',
          borderTopColor: '#D97757',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!isLoggedIn) return null
  if (requireCreator && !currentUser?.isCreator) return null

  return <>{children}</>
}

export default ProtectedRoute
