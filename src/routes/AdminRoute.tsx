import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { decodeJWT } from '../utils/jwtUtils';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (token) {
      const decodedToken = decodeJWT(token);
      const role = decodedToken?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (decodedToken && role === "Admin") {
        setIsAdmin(true);
      }
    }
  }, [token]);

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute; 