import React, { useEffect, useState } from 'react';
import { History, ShieldAlert, ArrowDownUp, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { subscribeToUserTransactions, subscribeToAllTransactions } from '../services/adminService';
import { formatCurrency } from '../data/cryptoAssets';

export const TransactionHistory: React.FC = () => {
  const { userEmail, userAccount, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my');

  useEffect(() => {
    let unsubscribe: () => void;

    if (viewMode === 'all' && isAdmin) {
      unsubscribe = subscribeToAllTransactions((txs) => setTransactions(txs));
    } else if (userAccount) {
      unsubscribe = subscribeToUserTransactions(userAccount.uid, userEmail, (txs) => setTransactions(txs));
    } else {
      setTransactions([]);
      return;
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userAccount, userEmail, viewMode, isAdmin]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Transaction & Audit History</h3>
            <p className="text-xs text-slate-400">
              Real-time Firestore audit log for deposits, swaps, withdrawals, and fee interceptions.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('my')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'my' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Log
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All System Logs (Admin)
            </button>
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <History className="w-10 h-10 mx-auto text-slate-700" />
          <p className="text-sm">No transaction records found in Firestore for this account.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">User Email</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-right">Value (USD)</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="capitalize font-sans font-semibold text-slate-200 flex items-center gap-1.5">
                      {tx.type === 'swap' && <ArrowDownUp className="w-3.5 h-3.5 text-indigo-400" />}
                      {tx.type === 'deposit' && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />}
                      {tx.type === 'withdrawal' && <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />}
                      {tx.type === 'admin_adjustment' && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
                      {tx.type}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-300 truncate max-w-[150px]">
                    {tx.userEmail}
                  </td>

                  <td className="px-4 py-3.5 text-slate-200">
                    {tx.type === 'swap' && (
                      <span>
                        Swapped {tx.fromAmount} {tx.fromSymbol} → {tx.toAmount?.toFixed(4)} {tx.toSymbol}
                      </span>
                    )}
                    {tx.type === 'deposit' && <span>Deposited {tx.toAmount} {tx.toSymbol}</span>}
                    {tx.type === 'withdrawal' && <span>Withdrawal {tx.fromAmount} {tx.fromSymbol}</span>}
                    {tx.type === 'admin_adjustment' && <span className="text-amber-300">{tx.note}</span>}
                  </td>

                  <td className="px-4 py-3.5 text-right font-bold text-slate-100">
                    {formatCurrency(tx.amountUsd || 0)}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    {tx.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <AlertCircle className="w-3 h-3 text-amber-400" /> Pending
                      </span>
                    )}
                    {tx.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                    {tx.status === 'intercepted_insufficient_gas' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        <AlertCircle className="w-3 h-3" /> Intercepted (Low Gas)
                      </span>
                    )}
                    {tx.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
