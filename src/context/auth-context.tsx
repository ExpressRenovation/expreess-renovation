'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getSafeAuth } from '@/lib/firebase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getSafeAuth will only run on the client, preventing build errors
    const auth = getSafeAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // Sync the server-side session cookie with the client auth state.
      // Without this, verifyAuth() in server actions/components always returns
      // null because cookies().get('session') is undefined — which is why
      // admin-gated panels (calibración, jobs) degraded to "solo administradores"
      // even for a user whose account carries the { admin: true } claim.
      try {
        if (user) {
          // Force refresh so the ID Token carries the latest custom claims
          // (e.g. { admin: true } set by set-admin.mjs after the previous
          // login session's token was already minted).
          const idToken = await user.getIdToken(true);
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        } else {
          await fetch('/api/auth/session', { method: 'DELETE' });
        }
      } catch (err) {
        console.error('[AuthContext] session cookie sync failed:', err);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const auth = getSafeAuth();
      await firebaseSignOut(auth);
      // Clear the server session too, in case onAuthStateChanged is slow.
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Children are rendered unconditionally, including while auth is still
  // resolving.
  //
  // This provider wraps the entire app. Returning a skeleton until `loading`
  // flipped meant the server — where the `useEffect` above never runs, so
  // `loading` is always true — rendered that skeleton and nothing else. Every
  // public page was served to crawlers and social scrapers as an empty shell
  // with no headings, no copy and no structured data.
  //
  // Routes that genuinely require a session gate themselves on the `loading`
  // and `user` values exposed here; see `DashboardLayout`.
  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
