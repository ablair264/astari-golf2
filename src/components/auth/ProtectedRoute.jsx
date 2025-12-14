import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1e2329] text-gray-300">
        Checking credentials...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
