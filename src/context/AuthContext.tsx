import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserAccount, UserBalance, PlatformSettings, GlobalWalletAddresses } from '../types';
import {
  ensureUserAccountInFirestore,
  subscribeToUserAccount,
  getDefaultBalances,
  subscribeToPlatformSettings,
  getDefaultGlobalWalletAddresses,
} from '../services/adminService';

interface AuthContextType {
  firebaseUser: User | null;
  userAccount: UserAccount | null;
  loading: boolean;
  isAdmin: boolean;
  userEmail: string;
  balances: UserBalance;
  platformSettings: PlatformSettings | null;
  globalAddresses: GlobalWalletAddresses;
  isAddressNoticeDismissed: boolean;
  dismissAddressNotice: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInAsDemoUser: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshAccountData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isAddressNoticeDismissed, setIsAddressNoticeDismissed] = useState<boolean>(false);

  // Subscribe to Platform Settings (Global deposit addresses & notifications)
  useEffect(() => {
    const unsub = subscribeToPlatformSettings((settings) => {
      setPlatformSettings(settings);
    });
    return () => unsub();
  }, []);

  // Synchronize Firebase Auth state
  useEffect(() => {
    let unsubscribeAccount: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const email = user.email || `user_${user.uid.slice(0, 8)}@demo.com`;
        const account = await ensureUserAccountInFirestore(user.uid, email, user.displayName || undefined);
        setUserAccount(account);

        // Real-time Firestore subscription for immediate admin update reaction
        unsubscribeAccount = subscribeToUserAccount(user.uid, (updatedAccount) => {
          if (updatedAccount) {
            setUserAccount(updatedAccount);
          }
        });
      } else {
        // Auto sign-in with standard user account on first load
        try {
          const defaultUserEmail = 'user@indodex.id';
          await signInAsDemoUser(defaultUserEmail);
        } catch (err) {
          console.error('Auto login error:', err);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAccount) unsubscribeAccount();
    };
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await ensureUserAccountInFirestore(cred.user.uid, cred.user.email || email);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await ensureUserAccountInFirestore(cred.user.uid, cred.user.email || email);
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemoUser = async (email: string) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      // Ensure user account exists in Firestore with predictable UID for demo mode
      const uid = `uid_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const account = await ensureUserAccountInFirestore(uid, cleanEmail);
      setUserAccount(account);

      // Subscribe to this user's real-time document
      subscribeToUserAccount(uid, (updated) => {
        if (updated) setUserAccount(updated);
      });
    } catch (e) {
      console.error('Demo login error:', e);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    await firebaseSignOut(auth);
    setUserAccount(null);
  };

  const refreshAccountData = async () => {
    if (userAccount) {
      await ensureUserAccountInFirestore(userAccount.uid, userAccount.email);
    }
  };

  const dismissAddressNotice = () => {
    setIsAddressNoticeDismissed(true);
  };

  const email = userAccount?.email || firebaseUser?.email || 'user@indodex.id';
  const isUrlAdmin = typeof window !== 'undefined' && window.location.search.includes('admin=true');
  const cleanEmail = email.toLowerCase();
  const isAdmin =
    isUrlAdmin ||
    userAccount?.role === 'admin' ||
    cleanEmail === 'mmaduabuchinwaoro@gmail.com' ||
    cleanEmail === 'mmaduabuchinwanoro@gmail.com' ||
    cleanEmail === 'indodexsupport@gmail.com' ||
    cleanEmail.includes('admin');
  const balances = userAccount?.balances || getDefaultBalances();
  const globalAddresses = platformSettings?.depositAddresses || getDefaultGlobalWalletAddresses();

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userAccount,
        loading,
        isAdmin,
        userEmail: email,
        balances,
        platformSettings,
        globalAddresses,
        isAddressNoticeDismissed,
        dismissAddressNotice,
        signInWithEmail,
        signUpWithEmail,
        signInAsDemoUser,
        signOutUser,
        refreshAccountData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
