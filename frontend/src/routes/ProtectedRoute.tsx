import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logoutUser, isAuthenticated } from '../services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      // Fast synchronous check
      if (!isAuthenticated()) {
        if (isMounted) {
          setIsAuth(false);
          setIsVerifying(false);
        }
        return;
      }

      // Backend token verification
      try {
        const user = await getCurrentUser();
        if (user) {
          if (isMounted) setIsAuth(true);
        } else {
          logoutUser();
          if (isMounted) setIsAuth(false);
        }
      } catch (error) {
        logoutUser();
        if (isMounted) setIsAuth(false);
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (isVerifying) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
