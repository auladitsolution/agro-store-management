'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { IUser, Permission, UserRole } from '@/types';
import { hasPermission } from '@/lib/permissions/rbac';

interface AuthContextType {
  user: IUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  logout: async () => {},
  can: () => false,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDbUser = async (fbUser: FirebaseUser | null) => {
    try {
      let headers: Record<string, string> = {};
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        headers = { Authorization: `Bearer ${idToken}` };
      }

      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Fallback demo user for local initial setup
        setUser({
          _id: 'owner_default',
          firebaseUid: 'demo_owner_uid',
          name: 'মোঃ আওলাদ হোসেন',
          email: 'owner@agrostore.com',
          role: 'OWNER',
          permissions: [],
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      // Fallback demo user for local setup
      setUser({
        _id: 'owner_default',
        firebaseUid: 'demo_owner_uid',
        name: 'মোঃ আওলাদ হোসেন',
        email: 'owner@agrostore.com',
        role: 'OWNER',
        permissions: [],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setFirebaseUser(currUser);
      await fetchDbUser(currUser);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await fetchDbUser(result.user);
    } catch (error) {
      console.error('Google Sign In error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      await fetchDbUser(result.user);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      if (typeof document !== 'undefined') {
        document.cookie = 'demo_user_email=; Max-Age=0; path=/;';
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const can = useMemo(() => {
    return (permission: Permission) => {
      if (!user) return false;
      return hasPermission(user, permission);
    };
  }, [user]);

  const refreshUser = async () => {
    await fetchDbUser(firebaseUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        loginWithGoogle,
        loginWithEmail,
        logout,
        can,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
