import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import type { JSX } from 'react';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps): JSX.Element {
  const { user, token } = useSelector((state: RootState) => state.auth);
  if (!token || !user) return <Navigate to="/login" replace />;
  const userRole = user.role?.toLowerCase();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}