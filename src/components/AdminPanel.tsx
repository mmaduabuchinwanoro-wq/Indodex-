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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_ASSETS, getAssetBySymbol, formatCurrency } from '../data/cryptoAssets';
import {
  updateBalanceByEmail,
  adjustBalanceByEmail,
  subscribeToAllUsers,
  subscribeToAllTransactions,
  approvePendingWithdrawal,
  rejectPendingWithdrawal,
} from '../services/adminService';
import { UserAccount, UserBalance, Transaction } from '../types';

export const AdminPanel: React.FC = () => {
  const { userEmail, isAdmin } = useAuth();

  const [targetEmail, setTargetEmail] = useState<string>(userEmail || 'trader@indodex.id');
  const [editingBalances, setEditingBalances] = useState<UserBalance>({});
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [pendingTxList, setPendingTxList] = useState<Transaction[]>([]);
  const [selectedUserDoc, setSelectedUserDoc] = useState<UserAccount | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      const pending = txs.filter((t) => t.status === 'pending');
      setPendingTxList(pending);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTxs();
    };
  }, [targetEmail]);

  const handleApproveTx = async (txId: string) => {
    setActionLoading(txId);
    const res = await approvePendingWithdrawal(txId, userEmail);
    setActionLoading(null);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Withdrawal approved successfully!' });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleRejectTx = async (tx: Transaction) => {
    setActionLoading(tx.id);
    const res = await rejectPendingWithdrawal(tx, userEmail);
    setActionLoading(null);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Withdrawal rejected and balance refunded.' });
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

  const handleQuickPreset = async (symbol: string, presetAmount: number) => {
    setEditingBalances((prev) => ({ ...prev, [symbol]: presetAmount }));
    setIsSaving(true);
    const res = await updateBalanceByEmail(targetEmail, symbol, presetAmount, userEmail);
    setIsSaving(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
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
              <h2 className="text-xl font-bold text-slate-100">Firestore Admin Control Center</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Direct Atomic Writes
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target user email balances directly in Firestore. Changes survive page refreshes and server reloads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Admin Auth: <strong className="text-emerald-400 font-mono">{userEmail}</strong></span>
        </div>
      </div>

      {/* Target User Search & Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" /> Target User Email
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

          {/* Quick preset for support admin email */}
          <button
            onClick={() => setTargetEmail('indodexsupport@gmail.com')}
            className="w-full py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-3.5 h-3.5" /> Select indodexsupport@gmail.com
          </button>

          {/* Registered Users List from Firestore */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">
              Active Firestore Users ({allUsers.length})
            </span>
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
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

        {/* Balance Editor Panel */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                Atomic Firestore Balance Management
              </h3>
              <p className="text-xs text-slate-400">
                Updating balances for: <strong className="text-indigo-300 font-mono">{targetEmail}</strong>
              </p>
            </div>

            <button
              onClick={handleSaveAllBalances}
              disabled={isSaving}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Writing to Firestore...' : 'Sync All Balances to Firestore'}
            </button>
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
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

          {/* Asset Balance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
            {SUPPORTED_ASSETS.map((asset) => {
              const currentVal = editingBalances[asset.symbol] ?? 0;
              return (
                <div
                  key={asset.id}
                  className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition-colors"
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

                    {/* Quick test buttons for Gas condition testing */}
                    {asset.symbol === 'ETH' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleQuickPreset('ETH', 0.1)}
                          title="Set Low ETH Gas (0.1 ETH) to trigger Interceptor prompt"
                          className="px-1.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-mono rounded hover:bg-red-500/30"
                        >
                          Low Gas (0.1)
                        </button>
                        <button
                          onClick={() => handleQuickPreset('ETH', 0.85)}
                          title="Set Sufficient ETH Gas (0.85 ETH)"
                          className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono rounded hover:bg-emerald-500/30"
                        >
                          Gas OK (0.85)
                        </button>
                      </div>
                    )}
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

      {/* Pending Withdrawals Queue Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-slate-100">
              Pending Withdrawal Approval Queue ({pendingTxList.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Non-USDT withdrawals require manual approval or rejection.
          </span>
        </div>

        {pendingTxList.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No pending withdrawal requests in queue.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTxList.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                      Pending Approval
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {tx.fromAmount} {tx.fromSymbol} ({formatCurrency(tx.amountUsd)})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    User: <strong className="text-slate-200 font-mono">{tx.userEmail}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">{tx.note}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveTx(tx.id)}
                    disabled={actionLoading === tx.id}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleRejectTx(tx)}
                    disabled={actionLoading === tx.id}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <X className="w-4 h-4" /> Reject & Refund
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
