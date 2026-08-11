import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  User,
  Save,
  Plus,
  Minus,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Zap,
  Check,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownUp,
  Wallet,
  Bell,
  Settings,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_ASSETS, getAssetBySymbol, formatCurrency } from '../data/cryptoAssets';
import {
  updateBalanceByEmail,
  adjustBalanceByEmail,
  subscribeToAllUsers,
  subscribeToAllTransactions,
  approvePendingTransaction,
  rejectPendingTransaction,
  manualDepositByEmail,
  manualWithdrawalByEmail,
  updateGlobalWalletAddresses,
  getDefaultGlobalWalletAddresses,
} from '../services/adminService';
import { UserAccount, UserBalance, Transaction, GlobalWalletAddresses } from '../types';

export const AdminPanel: React.FC = () => {
  const { userEmail, isAdmin, globalAddresses, platformSettings } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'wallets'>('users');
  const [targetEmail, setTargetEmail] = useState<string>(userEmail || 'trader@indodex.id');
  const [editingBalances, setEditingBalances] = useState<UserBalance>({});
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [pendingTxList, setPendingTxList] = useState<Transaction[]>([]);
  const [allTxList, setAllTxList] = useState<Transaction[]>([]);
  const [selectedUserDoc, setSelectedUserDoc] = useState<UserAccount | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Manual Adjustment Form state
  const [manualAsset, setManualAsset] = useState<string>('USDT (TRC-20)');
  const [manualOperation, setManualOperation] = useState<'deposit' | 'withdraw'>('deposit');
  const [manualAmount, setManualAmount] = useState<string>('100');
  const [manualNote, setManualNote] = useState<string>('');

  // Global Wallet Addresses Settings state
  const [walletForm, setWalletForm] = useState<GlobalWalletAddresses>({});
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    'Platform deposit wallet addresses have been updated by administration. Please verify addresses before transferring funds.'
  );

  // Initialize wallet form from global addresses
  useEffect(() => {
    setWalletForm({
      ...getDefaultGlobalWalletAddresses(),
      ...globalAddresses,
    });
  }, [globalAddresses]);

  // Subscribe to all users and pending transactions in Firestore
  useEffect(() => {
    const unsubscribeUsers = subscribeToAllUsers((users) => {
      setAllUsers(users);
      const found = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
      if (found) {
        setSelectedUserDoc(found);
        setEditingBalances(found.balances || {});
      }
    });

    const unsubscribeTxs = subscribeToAllTransactions((txs) => {
      setAllTxList(txs);
      const pending = txs.filter((t) => t.status === 'pending');
      setPendingTxList(pending);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTxs();
    };
  }, [targetEmail]);

  const handleApproveTx = async (tx: Transaction) => {
    setActionLoading(tx.id);
    setStatusMessage(null);
    const res = await approvePendingTransaction(tx, userEmail);
    setActionLoading(null);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleRejectTx = async (tx: Transaction) => {
    setActionLoading(tx.id);
    setStatusMessage(null);
    const res = await rejectPendingTransaction(tx, userEmail, 'Rejected by administrator');
    setActionLoading(null);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSelectUser = (user: UserAccount) => {
    setTargetEmail(user.email);
    setSelectedUserDoc(user);
    setEditingBalances(user.balances || {});
    setStatusMessage(null);
  };

  const handleBalanceInputChange = (symbol: string, value: string) => {
    const num = parseFloat(value) || 0;
    setEditingBalances((prev) => ({
      ...prev,
      [symbol]: num,
    }));
  };

  const handleExecuteManualAdjustment = async () => {
    const amount = parseFloat(manualAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid positive adjustment amount.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    let res;
    if (manualOperation === 'deposit') {
      res = await manualDepositByEmail(
        targetEmail,
        manualAsset,
        amount,
        userEmail,
        manualNote || `Admin manual deposit (+${amount} ${manualAsset})`
      );
    } else {
      res = await manualWithdrawalByEmail(
        targetEmail,
        manualAsset,
        amount,
        userEmail,
        manualNote || `Admin manual withdrawal (-${amount} ${manualAsset})`
      );
    }

    setIsSaving(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      if (res.user) {
        setEditingBalances(res.user.balances || {});
      }
      setManualNote('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSaveSingleAssetBalance = async (symbol: string) => {
    setIsSaving(true);
    setStatusMessage(null);
    const amount = editingBalances[symbol] ?? 0;

    const res = await updateBalanceByEmail(targetEmail, symbol, amount, userEmail);
    setIsSaving(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSaveAllBalances = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    let successCount = 0;
    for (const asset of SUPPORTED_ASSETS) {
      const amount = editingBalances[asset.symbol] ?? 0;
      const res = await updateBalanceByEmail(targetEmail, asset.symbol, amount, userEmail);
      if (res.success) successCount++;
    }

    setIsSaving(false);
    setStatusMessage({
      type: 'success',
      text: `Atomic Firestore sync completed: Updated ${successCount} asset balances for ${targetEmail}.`,
    });
  };

  const handleSaveGlobalWalletAddresses = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const res = await updateGlobalWalletAddresses(walletForm, userEmail, broadcastMessage);
    setIsSaving(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Panel Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">Indodex Platform Administration</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Firestore Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              User control, manual balance adjustments, transaction approvals, and platform wallet management.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Admin Operator: <strong className="text-emerald-400 font-mono">{userEmail}</strong></span>
        </div>
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" /> User Control & Balances
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'transactions'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" /> Pending Approvals Workflow
          {pendingTxList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
              {pendingTxList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'wallets'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" /> Global Deposit Addresses
        </button>
      </div>

      {/* SYSTEM STATUS NOTIFICATION MESSAGE */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-mono">{statusMessage.text}</span>
        </div>
      )}

      {/* TAB 1: USER ACCOUNT CONTROL & MANUAL BALANCES */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* USER SEARCH & LIST */}
          <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" /> Lookup User by Email
            </h3>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="Enter user email address..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
              />
            </div>

            {/* Registered Firestore Users List */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">
                Firestore User Accounts ({allUsers.length})
              </span>
              <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                {allUsers.map((usr) => (
                  <button
                    key={usr.uid}
                    onClick={() => handleSelectUser(usr)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                      targetEmail.toLowerCase() === usr.email.toLowerCase()
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold font-mono truncate">{usr.email}</p>
                      <p className="text-[10px] text-slate-500">Role: {usr.role}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                      Active
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* USER BALANCE MANAGEMENT & MANUAL ADJUSTMENTS */}
          <div className="lg:col-span-2 space-y-6">
            {/* MANUAL ADJUSTMENT ACTION BAR */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" /> Manual Deposit / Withdrawal Action
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Target: <strong className="text-indigo-300">{targetEmail}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Select Asset */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Crypto Asset</label>
                  <select
                    value={manualAsset}
                    onChange={(e) => setManualAsset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-semibold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    {SUPPORTED_ASSETS.map((asset) => (
                      <option key={asset.id} value={asset.symbol}>
                        {asset.symbol} ({asset.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operation Type */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Adjustment Type</label>
                  <select
                    value={manualOperation}
                    onChange={(e) => setManualOperation(e.target.value as 'deposit' | 'withdraw')}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-semibold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="deposit">Manual Deposit (+)</option>
                    <option value="withdraw">Manual Withdrawal (-)</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Amount</label>
                  <input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Note / Reason */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Admin Reason / Transaction Note</label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="e.g. Manual top-up adjustment requested by user via support..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleExecuteManualAdjustment}
                disabled={isSaving}
                className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  manualOperation === 'deposit'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {manualOperation === 'deposit' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                Execute {manualOperation === 'deposit' ? 'Manual Deposit (+)' : 'Manual Withdrawal (-)'} directly to {targetEmail}
              </button>
            </div>

            {/* FULL ASSET BALANCE EDITOR */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    Full Asset Balance Direct Controls
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct balance overrides for <strong className="text-indigo-300 font-mono">{targetEmail}</strong>
                  </p>
                </div>

                <button
                  onClick={handleSaveAllBalances}
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Writing...' : 'Sync All Balances'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[400px] overflow-y-auto pr-1">
                {SUPPORTED_ASSETS.map((asset) => {
                  const currentVal = editingBalances[asset.symbol] ?? 0;
                  return (
                    <div
                      key={asset.id}
                      className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center border ${asset.iconBg}`}>
                            {asset.symbol.slice(0, 3)}
                          </span>
                          <div>
                            <h4 className="font-semibold text-xs text-slate-100">{asset.symbol}</h4>
                            <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{asset.network}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={currentVal}
                          onChange={(e) => handleBalanceInputChange(asset.symbol, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleSaveSingleAssetBalance(asset.symbol)}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500 rounded-lg text-xs font-medium transition-all shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTION APPROVAL WORKFLOW QUEUE */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  Pending Transaction Approvals Queue ({pendingTxList.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Approve or cancel user-initiated deposits, withdrawals, and swaps.
                </p>
              </div>
            </div>
          </div>

          {pendingTxList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600" />
              <span>No pending transactions in queue. All user requests are processed.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTxList.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                        Pending Approval
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase">
                        {tx.type}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                      {tx.type === 'deposit' && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ArrowDownLeft className="w-4 h-4" /> Deposit: +{tx.toAmount} {tx.toSymbol}
                        </span>
                      )}
                      {tx.type === 'withdrawal' && (
                        <span className="text-blue-400 flex items-center gap-1">
                          <ArrowUpRight className="w-4 h-4" /> Withdrawal: -{tx.fromAmount} {tx.fromSymbol}
                        </span>
                      )}
                      {tx.type === 'swap' && (
                        <span className="text-indigo-400 flex items-center gap-1">
                          <ArrowDownUp className="w-4 h-4" /> Swap: {tx.fromAmount} {tx.fromSymbol} ➔ {tx.toAmount?.toFixed(4)} {tx.toSymbol}
                        </span>
                      )}
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 font-sans">{formatCurrency(tx.amountUsd)}</span>
                    </div>

                    <div className="text-xs text-slate-400">
                      User Email: <strong className="text-indigo-300 font-mono">{tx.userEmail}</strong>
                    </div>

                    {tx.note && (
                      <p className="text-[11px] text-slate-500 font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        {tx.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleApproveTx(tx)}
                      disabled={actionLoading === tx.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" /> Approve & Credit
                    </button>
                    <button
                      onClick={() => handleRejectTx(tx)}
                      disabled={actionLoading === tx.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-red-600/20"
                    >
                      <X className="w-4 h-4" /> Reject & Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RECENT HISTORICAL TRANSACTIONS */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              System Transaction Audit History ({allTxList.length})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
              {allTxList.slice(0, 15).map((tx) => (
                <div
                  key={tx.id}
                  className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-slate-300"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold uppercase text-indigo-400">{tx.type}</span>: {tx.userEmail} — {tx.fromAmount || tx.toAmount} {tx.fromSymbol || tx.toSymbol}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : tx.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL WALLET ADDRESSES MANAGEMENT */}
      {activeTab === 'wallets' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">Global Deposit Wallet Addresses Panel</h3>
                <p className="text-xs text-slate-400">
                  Update platform deposit wallet addresses. Updating addresses synchronizes across all user deposit modals.
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveGlobalWalletAddresses}
              disabled={isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Broadcasting...' : 'Save & Broadcast Addresses'}
            </button>
          </div>

          {/* BROADCAST NOTIFICATION TEXT BOX */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-amber-400 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" /> Platform Address Update Notification Message
            </label>
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Notice message displayed to users..."
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              Saving will dispatch this notification banner directly onto every user's dashboard overview.
            </p>
          </div>

          {/* ADDRESS INPUT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUPPORTED_ASSETS.map((asset) => {
              const currentAddress = walletForm[asset.symbol] || asset.depositAddress;
              return (
                <div
                  key={asset.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center border ${asset.iconBg}`}>
                        {asset.symbol.slice(0, 3)}
                      </span>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-100">{asset.name} ({asset.symbol})</h4>
                        <p className="text-[10px] text-slate-500">{asset.network}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Deposit Address</label>
                    <input
                      type="text"
                      value={currentAddress}
                      onChange={(e) =>
                        setWalletForm((prev) => ({
                          ...prev,
                          [asset.symbol]: e.target.value,
                        }))
                      }
                      placeholder={`Enter custom ${asset.symbol} address...`}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
