import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logoutUser, isAuthenticated } from '../../services/authService';

export const Role = {
  ADMIN: 'ADMIN',
  APPLICANT: 'APPLICANT',
  VERIFICATION_OFFICER: 'VERIFICATION_OFFICER',
  APPROVING_AUTHORITY: 'APPROVING_AUTHORITY'
} as const;

export type Role = typeof Role[keyof typeof Role];

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
}

export const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
          if (isMounted) {
            setIsAuth(true);
            setUserRole(user.role || null);
          }
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

  if (userRole && !allowedRoles.includes(userRole as Role)) {
    // Redirect to a safe existing dashboard page if unauthorized
    if (userRole === Role.APPLICANT) {
      return <Navigate to="/applications" replace />;
    } else if (userRole === Role.VERIFICATION_OFFICER) {
      return <Navigate to="/verification-queue" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
