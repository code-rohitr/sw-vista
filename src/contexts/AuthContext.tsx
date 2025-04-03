'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Entity {
  id: string;
  name: string;
  description?: string;
  entity_type_id: string;
  parent_id?: string;
  created_at: Date;
  entityType: {
    id: string;
    name: string;
    description?: string;
    created_at: Date;
  };
}

interface EntityRole {
  id: string;
  name: string;
  description?: string;
  entity_id: string;
  entity_type_id: string;
  template_id?: string;
  template?: {
    id: string;
    name: string;
    permissions: string;
  };
  entityRolePermissions: {
    permission: {
      id: string;
      name: string;
      action: string;
      scope?: string;
      resource_type?: string;
    };
    resource: {
      id: string;
      name: string;
      path: string;
    };
  }[];
}

interface EntityMembership {
  id: string;
  entityId: string;
  entityName: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

interface User {
  id: string;
  username: string;
  isSystemAdmin: boolean;
  entityMemberships: EntityMembership[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isSystemAdmin: boolean;
  hasPermission: (permission: string, entityId?: string) => boolean;
  hasEntityRole: (roleName: string, entityId: string) => boolean;
  hasEntityAccess: (entityId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const hasPermission = (permission: string, entityId?: string): boolean => {
    if (!user) return false;
    if (user.isSystemAdmin) return true;

    if (entityId) {
      const membership = user.entityMemberships.find(m => m.entityId === entityId);
      return membership?.permissions.includes(permission) ?? false;
    }

    return user.entityMemberships.some(m => m.permissions.includes(permission));
  };

  const hasEntityRole = (roleName: string, entityId: string): boolean => {
    if (!user) return false;
    if (user.isSystemAdmin) return true;

    return user.entityMemberships.some(
      m => m.entityId === entityId && m.roleName === roleName
    );
  };

  const hasEntityAccess = (entityId: string): boolean => {
    if (!user) return false;
    if (user.isSystemAdmin) return true;

    return user.entityMemberships.some(m => m.entityId === entityId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
        isSystemAdmin: user?.isSystemAdmin ?? false,
        hasPermission,
        hasEntityRole,
        hasEntityAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
