'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously as fbSignInAnonymously,
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithCredential,
  linkWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAnon: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  };

  // If the current user is anonymous, LINK the new credential so their uid
  // (and all their reports) carry over. Otherwise create a fresh account.
  const signUp = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const current = auth.currentUser;
    if (current?.isAnonymous) {
      try {
        const cred = EmailAuthProvider.credential(email, password);
        await linkWithCredential(current, cred);
        return;
      } catch (e: unknown) {
        // email already in use → fall back to normal signup
        const code = (e as { code?: string })?.code ?? '';
        if (!code.includes('email-already-in-use') && !code.includes('credential-already-in-use')) throw e;
      }
    }
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const current = auth.currentUser;
    if (current?.isAnonymous) {
      try {
        await linkWithPopup(current, new GoogleAuthProvider());
        return;
      } catch (e: unknown) {
        const code = (e as { code?: string })?.code ?? '';
        if (!code.includes('credential-already-in-use')) throw e;
        // credential belongs to existing account → sign in to it instead
      }
    }
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const signInAnon = async () => {
    const auth = getFirebaseAuth();
    if (auth.currentUser) return; // already signed in (anon or real)
    await fbSignInAnonymously(auth);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    // Mark explicit logout so dashboard doesn't auto-sign-in anonymously
    if (typeof window !== 'undefined') {
      localStorage.setItem('stocksage_explicit_logout', '1');
    }
    await signOut(auth);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAnonymous: user?.isAnonymous ?? false,
      signIn, signUp, signInWithGoogle, signInAnon, logout, getIdToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
