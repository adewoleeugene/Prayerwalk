"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Check for redirect result
    getRedirectResult(auth).catch((error) => {
      // Handle Errors here.
      console.error("Error getting redirect result:", error);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // After redirect, onAuthStateChanged and getRedirectResult will handle the user state.
    } catch (error) {
       console.error("Error during Google sign-in redirect: ", error);
       // The UI component can show a toast if this promise rejects, though it's less common with redirect.
       throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
