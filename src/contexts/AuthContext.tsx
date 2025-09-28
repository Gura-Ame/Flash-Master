import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, googleProvider } from '../utils/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithRedirect,
  signInWithPopup,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async signIn(email: string, password: string) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signUp(email: string, password: string) {
      await createUserWithEmailAndPassword(auth, email, password);
    },
    async signInWithGoogle() {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        await signInWithRedirect(auth, googleProvider);
      }
    },
    async logout() {
      await signOut(auth);
    },
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


