'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Entity {
  id: number;
  name: string;
  description?: string;
  entity_type_id: number;
}

interface EntityRole {
  id: number;
  name: string;
  description?: string;
  entity_id: number;
  entity_type_id: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  isSystemAdmin: boolean;
  entityMembers: {
    entity: Entity;
    entityRole: EntityRole;
  }[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isSystemAdmin: () => boolean;
  hasEntityRole: (entityId: number, roleName: string) => boolean;
  getEntityMemberships: () => { entity: Entity; role: EntityRole }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const { user, token } = await response.json();

      // Store user and token
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);

      setUser(user);

      // Redirect based on role
      if (user.isSystemAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    setUser(null);
    router.push('/login');
  };

  const isSystemAdmin = () => {
    return user?.isSystemAdmin || false;
  };

  const hasEntityRole = (entityId: number, roleName: string) => {
    return user?.entityMembers?.some(
      member => member.entity.id === entityId && member.entityRole.name === roleName
    ) || false;
  };

  const getEntityMemberships = () => {
    return (
      user?.entityMembers.map(member => ({
        entity: member.entity,
        role: member.entityRole,
      })) || []
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isSystemAdmin,
        hasEntityRole,
        getEntityMemberships,
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
