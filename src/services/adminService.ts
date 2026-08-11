import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserAccount, Transaction, UserBalance, GlobalWalletAddresses, PlatformSettings } from '../types';
import { SUPPORTED_ASSETS } from '../data/cryptoAssets';

const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';
const SETTINGS_COLLECTION = 'settings';
const PLATFORM_CONFIG_DOC = 'platform_config';

/**
 * Creates default deposit wallet addresses map from SUPPORTED_ASSETS.
 */
export function getDefaultGlobalWalletAddresses(): GlobalWalletAddresses {
  const addresses: GlobalWalletAddresses = {};
  SUPPORTED_ASSETS.forEach((asset) => {
    addresses[asset.symbol] = asset.depositAddress;
  });
  return addresses;
}

/**
 * ADMIN SERVICE: Perform manual deposit for a user account by email.
 */
export async function manualDepositByEmail(
  targetEmail: string,
  symbol: string,
  depositAmount: number,
  adminEmail: string,
  note?: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  try {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Target user email is required.' };
    }
    if (depositAmount <= 0) {
      return { success: false, message: 'Deposit amount must be greater than zero.' };
    }

    const res = await adjustBalanceByEmail(cleanEmail, symbol, depositAmount, adminEmail);
    if (!res.success) return res;

    const asset = SUPPORTED_ASSETS.find((a) => a.symbol === symbol);
    const price = asset?.priceUsd || 1;

    // Log manual deposit transaction
    await logTransaction({
      userId: res.user?.uid || cleanEmail,
      userEmail: cleanEmail,
      type: 'deposit',
      toSymbol: symbol,
      toAmount: depositAmount,
      amountUsd: depositAmount * price,
      feeUsd: 0,
      status: 'completed',
      timestamp: new Date().toISOString(),
      note: note || `Manual Deposit credited by Admin (${adminEmail}): +${depositAmount} ${symbol}`,
    });

    return {
      success: true,
      message: `Successfully deposited +${depositAmount} ${symbol} directly into ${cleanEmail}'s account balance.`,
      user: res.user,
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Manual deposit failed.' };
  }
}

/**
 * ADMIN SERVICE: Perform manual withdrawal/deduction for a user account by email.
 */
export async function manualWithdrawalByEmail(
  targetEmail: string,
  symbol: string,
  deductAmount: number,
  adminEmail: string,
  note?: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  try {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Target user email is required.' };
    }
    if (deductAmount <= 0) {
      return { success: false, message: 'Withdrawal amount must be greater than zero.' };
    }

    const res = await adjustBalanceByEmail(cleanEmail, symbol, -deductAmount, adminEmail);
    if (!res.success) return res;

    const asset = SUPPORTED_ASSETS.find((a) => a.symbol === symbol);
    const price = asset?.priceUsd || 1;

    // Log manual withdrawal transaction
    await logTransaction({
      userId: res.user?.uid || cleanEmail,
      userEmail: cleanEmail,
      type: 'withdrawal',
      fromSymbol: symbol,
      fromAmount: deductAmount,
      amountUsd: deductAmount * price,
      feeUsd: 0,
      status: 'completed',
      timestamp: new Date().toISOString(),
      note: note || `Manual Withdrawal deducted by Admin (${adminEmail}): -${deductAmount} ${symbol}`,
    });

    return {
      success: true,
      message: `Successfully deducted -${deductAmount} ${symbol} from ${cleanEmail}'s account balance.`,
      user: res.user,
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Manual withdrawal failed.' };
  }
}

/**
 * ADMIN SERVICE: Unified Approve Pending Transaction (Deposit, Withdrawal, Swap).
 */
export async function approvePendingTransaction(
  tx: Transaction,
  adminEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const txDocRef = doc(db, TRANSACTIONS_COLLECTION, tx.id);

    if (tx.type === 'deposit') {
      // Deposit Approval: Credit user's balance in Firestore
      const symbol = tx.toSymbol || tx.fromSymbol || 'USDT (TRC-20)';
      const amount = tx.toAmount || tx.fromAmount || 0;

      if (amount > 0 && tx.userEmail) {
        await adjustBalanceByEmail(tx.userEmail, symbol, amount, adminEmail);
      }
    } else if (tx.type === 'swap') {
      // Swap Approval: Credit the output asset 'toSymbol' (fromSymbol was already deducted on request submission)
      const toSymbol = tx.toSymbol;
      const toAmount = tx.toAmount || 0;

      if (toSymbol && toAmount > 0 && tx.userEmail) {
        await adjustBalanceByEmail(tx.userEmail, toSymbol, toAmount, adminEmail);
      }
    } else if (tx.type === 'withdrawal') {
      // Withdrawal Approval: Balance was already deducted/held on request submission. Simply mark as completed.
    }

    await updateDoc(txDocRef, {
      status: 'completed',
      note: `Approved by Admin (${adminEmail}) at ${new Date().toLocaleString()}`,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: `Transaction (${tx.type.toUpperCase()}) approved successfully.` };
  } catch (error: any) {
    console.error('Error approving pending transaction:', error);
    return { success: false, message: error.message || 'Failed to approve transaction.' };
  }
}

/**
 * ADMIN SERVICE: Unified Reject & Cancel Pending Transaction (Deposit, Withdrawal, Swap).
 */
export async function rejectPendingTransaction(
  tx: Transaction,
  adminEmail: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const txDocRef = doc(db, TRANSACTIONS_COLLECTION, tx.id);

    await updateDoc(txDocRef, {
      status: 'failed',
      note: `Rejected by Admin (${adminEmail})${reason ? `: ${reason}` : ''}`,
      updatedAt: new Date().toISOString(),
    });

    // Refund balances if funds were deducted when submitted
    if (tx.type === 'withdrawal' && tx.fromSymbol && tx.fromAmount && tx.fromAmount > 0 && tx.userEmail) {
      await adjustBalanceByEmail(tx.userEmail, tx.fromSymbol, tx.fromAmount, adminEmail);
    } else if (tx.type === 'swap' && tx.fromSymbol && tx.fromAmount && tx.fromAmount > 0 && tx.userEmail) {
      await adjustBalanceByEmail(tx.userEmail, tx.fromSymbol, tx.fromAmount, adminEmail);
    }

    return {
      success: true,
      message: `Transaction rejected and cancelled.${tx.type !== 'deposit' ? ' Funds refunded to user balance.' : ''}`,
    };
  } catch (error: any) {
    console.error('Error rejecting pending transaction:', error);
    return { success: false, message: error.message || 'Failed to reject transaction.' };
  }
}

/**
 * ADMIN SERVICE: Subscribe to Global Platform Settings (Wallet Addresses & Notice).
 */
export function subscribeToPlatformSettings(
  onUpdate: (settings: PlatformSettings) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_COLLECTION, PLATFORM_CONFIG_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PlatformSettings;
        const mergedAddresses = { ...getDefaultGlobalWalletAddresses(), ...data.depositAddresses };
        onUpdate({
          ...data,
          depositAddresses: mergedAddresses,
        });
      } else {
        onUpdate({
          depositAddresses: getDefaultGlobalWalletAddresses(),
        });
      }
    },
    (error) => {
      console.error('Error subscribing to platform settings:', error);
    }
  );
}

/**
 * ADMIN SERVICE: Save Custom Global Wallet Addresses & Optional Broadcast Notice in Firestore.
 */
export async function updateGlobalWalletAddresses(
  addresses: GlobalWalletAddresses,
  adminEmail: string,
  notificationMsg?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PLATFORM_CONFIG_DOC);

    const merged = { ...getDefaultGlobalWalletAddresses(), ...addresses };

    const payload: PlatformSettings = {
      depositAddresses: merged,
      lastAddressUpdateNotice: {
        updatedAt: new Date().toISOString(),
        message: notificationMsg || 'Platform deposit wallet addresses have been updated by administration. Please verify addresses before depositing funds.',
        updatedBy: adminEmail,
      },
    };

    await setDoc(docRef, payload, { merge: true });

    return {
      success: true,
      message: 'Global deposit wallet addresses updated and broadcast notification dispatched across all user accounts!',
    };
  } catch (error: any) {
    console.error('Error updating global wallet addresses:', error);
    return { success: false, message: error.message || 'Failed to update platform settings.' };
  }
}

/**
 * Creates default balances for a new user account if none exist.
 */
export function getDefaultBalances(): UserBalance {
  const initialBalances: UserBalance = {};
  SUPPORTED_ASSETS.forEach((asset) => {
    // Default initial mock balances for demo account experience
    if (asset.symbol === 'BTC') initialBalances[asset.symbol] = 0.45;
    else if (asset.symbol === 'USDT (TRC-20)') initialBalances[asset.symbol] = 2500;
    else if (asset.symbol === 'USDT (ERC-20)') initialBalances[asset.symbol] = 1200;
    else if (asset.symbol === 'ETH') initialBalances[asset.symbol] = 0.15; // Low ETH gas to showcase fee interceptor
    else if (asset.symbol === 'TRX') initialBalances[asset.symbol] = 120;
    else if (asset.symbol === 'BNB') initialBalances[asset.symbol] = 1.2;
    else if (asset.symbol === 'TON') initialBalances[asset.symbol] = 25;
    else if (asset.symbol === 'HMSTR') initialBalances[asset.symbol] = 15000;
    else initialBalances[asset.symbol] = 0;
  });
  return initialBalances;
}

/**
 * Ensures user document exists in Firestore and returns current UserAccount data.
 */
export async function ensureUserAccountInFirestore(
  uid: string,
  email: string,
  displayName?: string
): Promise<UserAccount> {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(userDocRef);

  const lowerEmail = email.toLowerCase();
  // Check if admin user
  const isAdmin = lowerEmail === 'indodexsupport@gmail.com' || lowerEmail.includes('admin');

  if (docSnap.exists()) {
    const existingData = docSnap.data() as UserAccount;
    // Ensure all supported assets are present in balances map
    const updatedBalances = { ...getDefaultBalances(), ...existingData.balances };
    const updatedAccount: UserAccount = {
      ...existingData,
      role: isAdmin ? 'admin' : existingData.role || 'user',
      balances: updatedBalances,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, updatedAccount, { merge: true });
    return updatedAccount;
  } else {
    // Create new account document in Firestore
    const newAccount: UserAccount = {
      uid,
      email: lowerEmail,
      displayName: displayName || email.split('@')[0],
      role: isAdmin ? 'admin' : 'user',
      balances: getDefaultBalances(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, newAccount);
    return newAccount;
  }
}

/**
 * Listens in real-time to a user account document in Firestore.
 */
export function subscribeToUserAccount(
  uid: string,
  onUpdate: (user: UserAccount | null) => void
): Unsubscribe {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  return onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as UserAccount);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error subscribing to user account:', error);
    }
  );
}

/**
 * ADMIN SERVICE: Target user balance updates by email.
 * Executes direct atomic writes to Firestore document to survive refreshes and server reloads.
 */
export async function updateBalanceByEmail(
  targetEmail: string,
  symbol: string,
  newAmount: number,
  adminUserEmail: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  try {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Target user email is required.' };
    }

    const q = query(collection(db, USERS_COLLECTION), where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);

    let userDocRef;
    let existingAccount: UserAccount | null = null;

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      userDocRef = doc(db, USERS_COLLECTION, userDoc.id);
      existingAccount = userDoc.data() as UserAccount;
    } else {
      // If user does not exist yet, create doc keyed by a clean email ID so target email balance survives immediately
      const generatedDocId = `email_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      userDocRef = doc(db, USERS_COLLECTION, generatedDocId);

      const existingDoc = await getDoc(userDocRef);
      if (existingDoc.exists()) {
        existingAccount = existingDoc.data() as UserAccount;
      } else {
        existingAccount = {
          uid: generatedDocId,
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          role: 'user',
          balances: getDefaultBalances(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    // Atomic update of user's balance map in Firestore
    const updatedBalances = {
      ...(existingAccount?.balances || getDefaultBalances()),
      [symbol]: Math.max(0, Number(newAmount)),
    };

    const updatePayload = {
      ...existingAccount,
      email: cleanEmail,
      balances: updatedBalances,
      updatedAt: new Date().toISOString(),
    };

    // Write directly to Firestore document
    await setDoc(userDocRef, updatePayload, { merge: true });

    // Log admin audit transaction
    await logTransaction({
      userId: existingAccount.uid,
      userEmail: cleanEmail,
      type: 'admin_adjustment',
      toSymbol: symbol,
      toAmount: newAmount,
      amountUsd: 0,
      feeUsd: 0,
      status: 'completed',
      timestamp: new Date().toISOString(),
      note: `Admin (${adminUserEmail}) updated ${symbol} balance to ${newAmount}`,
    });

    return {
      success: true,
      message: `Successfully updated ${symbol} balance for ${cleanEmail} to ${newAmount} in Firestore.`,
      user: updatePayload as UserAccount,
    };
  } catch (error: any) {
    console.error('Error updating user balance by email:', error);
    return {
      success: false,
      message: `Firestore atomic write failed: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * ADMIN SERVICE: Adjust user balance relative (delta + / -) by target email.
 */
export async function adjustBalanceByEmail(
  targetEmail: string,
  symbol: string,
  deltaAmount: number,
  adminUserEmail: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  try {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);

    let currentBalance = 0;
    if (!querySnapshot.empty) {
      const account = querySnapshot.docs[0].data() as UserAccount;
      currentBalance = account.balances[symbol] || 0;
    }

    const newAmount = Math.max(0, currentBalance + deltaAmount);
    return await updateBalanceByEmail(cleanEmail, symbol, newAmount, adminUserEmail);
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * ADMIN SERVICE: Fetch all users from Firestore
 */
export async function getAllUsersFromFirestore(): Promise<UserAccount[]> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: UserAccount[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push(docSnap.data() as UserAccount);
    });
    return users;
  } catch (error) {
    console.error('Failed to fetch users from Firestore:', error);
    return [];
  }
}

/**
 * Subscribe to all users in Firestore (real-time for Admin Panel)
 */
export function subscribeToAllUsers(
  onUpdate: (users: UserAccount[]) => void
): Unsubscribe {
  const usersRef = collection(db, USERS_COLLECTION);
  return onSnapshot(usersRef, (snapshot) => {
    const list: UserAccount[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as UserAccount);
    });
    onUpdate(list);
  }, (error) => {
    console.error('Error subscribing to all users:', error);
  });
}

/**
 * Saves a transaction log to Firestore.
 */
export async function logTransaction(
  tx: Omit<Transaction, 'id'>
): Promise<string> {
  try {
    const txRef = collection(db, TRANSACTIONS_COLLECTION);
    const docRef = await addDoc(txRef, {
      ...tx,
      timestamp: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to log transaction in Firestore:', error);
    return '';
  }
}

/**
 * Subscribe to user transactions in real-time.
 */
export function subscribeToUserTransactions(
  userId: string,
  userEmail: string,
  onUpdate: (txs: Transaction[]) => void
): Unsubscribe {
  const txRef = collection(db, TRANSACTIONS_COLLECTION);
  return onSnapshot(txRef, (snapshot) => {
    const txs: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<Transaction, 'id'>;
      if (data.userId === userId || data.userEmail?.toLowerCase() === userEmail.toLowerCase()) {
        txs.push({
          id: docSnap.id,
          ...data,
        });
      }
    });
    // Sort descending by timestamp
    txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    onUpdate(txs);
  });
}

/**
 * Subscribe to all system transactions in real-time for Admin.
 */
export function subscribeToAllTransactions(
  onUpdate: (txs: Transaction[]) => void
): Unsubscribe {
  const txRef = collection(db, TRANSACTIONS_COLLECTION);
  return onSnapshot(txRef, (snapshot) => {
    const txs: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      txs.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Transaction, 'id'>),
      });
    });
    txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    onUpdate(txs);
  });
}

/**
 * ADMIN SERVICE: Approve a pending withdrawal transaction.
 */
export async function approvePendingWithdrawal(
  txId: string,
  adminEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const txDocRef = doc(db, TRANSACTIONS_COLLECTION, txId);
    await updateDoc(txDocRef, {
      status: 'completed',
      note: `Approved by Admin (${adminEmail}) at ${new Date().toLocaleString()}`,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, message: 'Withdrawal request approved successfully.' };
  } catch (error: any) {
    console.error('Error approving withdrawal:', error);
    return { success: false, message: error.message || 'Failed to approve withdrawal.' };
  }
}

/**
 * ADMIN SERVICE: Reject a pending withdrawal transaction and refund the user's deducted balance.
 */
export async function rejectPendingWithdrawal(
  tx: Transaction,
  adminEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const txDocRef = doc(db, TRANSACTIONS_COLLECTION, tx.id);
    await updateDoc(txDocRef, {
      status: 'failed',
      note: `Rejected by Admin (${adminEmail}). Balance refunded.`,
      updatedAt: new Date().toISOString(),
    });

    // Refund user balance if asset and amount exist
    if (tx.fromSymbol && tx.fromAmount && tx.fromAmount > 0 && tx.userEmail) {
      await adjustBalanceByEmail(tx.userEmail, tx.fromSymbol, tx.fromAmount, adminEmail);
    }

    return { success: true, message: 'Withdrawal rejected and funds refunded to user balance.' };
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error);
    return { success: false, message: error.message || 'Failed to reject withdrawal.' };
  }
}
