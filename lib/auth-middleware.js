// Authentication middleware for route protection
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import auth, { USER_ROLES, AUTH_EVENTS } from './auth';

/**
 * Hook to get current authentication state
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const currentUser = await auth.getSession();
        
        if (mounted) {
          setUser(currentUser);
          setRole(currentUser?.role || null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth events
    const handleAuthEvent = () => {
      checkAuth();
    };

    window.addEventListener(AUTH_EVENTS.LOGIN, handleAuthEvent);
    window.addEventListener(AUTH_EVENTS.LOGOUT, handleAuthEvent);

    return () => {
      mounted = false;
      window.removeEventListener(AUTH_EVENTS.LOGIN, handleAuthEvent);
      window.removeEventListener(AUTH_EVENTS.LOGOUT, handleAuthEvent);
    };
  }, []);

  return {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    isAdmin: role === USER_ROLES.ADMIN,
    isParent: role === USER_ROLES.PARENT
  };
};

/**
 * Higher-order component for route protection
 */
export const withAuth = (WrappedComponent, options = {}) => {
  const {
    requiredRole = null,
    redirectTo = '/',
    loadingComponent = null
  } = options;

  return function AuthenticatedComponent(props) {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
      if (loading) return;

      // Check if user is authenticated
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Check role requirement
      if (requiredRole && role !== requiredRole) {
        if (role === USER_ROLES.ADMIN) {
          router.push('/admin');
        } else if (role === USER_ROLES.PARENT) {
          router.push('/dashboard');
        } else {
          router.push(redirectTo);
        }
        return;
      }

      setShouldRender(true);
    }, [user, role, loading, router]);

    if (loading) {
      return loadingComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!shouldRender) {
      return null;
    }

    return <WrappedComponent {...props} user={user} role={role} />;
  };
};

/**
 * Component for protecting admin routes
 */
export const AdminRoute = ({ children, fallback = null }) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (role !== USER_ROLES.ADMIN) {
        // User is authenticated but not admin, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== USER_ROLES.ADMIN) {
    return fallback;
  }

  return children;
};

/**
 * Component for protecting parent routes
 */
export const ParentRoute = ({ children, fallback = null }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback;
  }

  return children;
};

/**
 * Hook for logout functionality
 */
export const useLogout = () => {
  const router = useRouter();

  const logout = async () => {
    try {
      await auth.logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      router.push('/');
    }
  };

  return logout;
};

/**
 * Redirect based on user role
 */
export const redirectByRole = (role, router) => {
  switch (role) {
    case USER_ROLES.ADMIN:
      router.push('/admin');
      break;
    case USER_ROLES.PARENT:
      router.push('/dashboard');
      break;
    default:
      router.push('/');
      break;
  }
};
