import { Navigate, Outlet } from 'react-router';
import { getToken } from '../lib/dataSource';

export default function ProtectedRoute() {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
