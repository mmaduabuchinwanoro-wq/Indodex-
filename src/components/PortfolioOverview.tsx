import React from 'react';
import {
  Wallet,
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownLeft,
  Fuel,
  ShieldCheck,
  TrendingUp,
  PieChart as PieIcon,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_ASSETS, formatCurrency, getAssetBySymbol } from '../data/cryptoAssets';

interface PortfolioOverviewProps {
  onOpenSwap: (symbol?: string) => void;
  onOpenDeposit: (symbol?: string) => void;
  onOpenWithdraw: (symbol?: string) => void;
  onOpenAdmin: () => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  onOpenSwap,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenAdmin,
}) => {
  const { balances, userEmail, userAccount } = useAuth();

  // Calculate total portfolio net worth
  let totalNetWorthUsd = 0;
  const holdingList = SUPPORTED_ASSETS.map((asset) => {
    const amount = balances[asset.symbol] || 0;
    const valueUsd = amount * asset.priceUsd;
    totalNetWorthUsd += valueUsd;
    return {
      ...asset,
      amount,
      valueUsd,
    };
  });

  const ethBalance = balances['ETH'] || 0;
  const trxBalance = balances['TRX'] || 0;
  const hasGasRequirement = ethBalance >= 0.7 || trxBalance >= 5000;

  return (
    <div className="space-y-6">
      {/* Net Worth Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mb-20 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Main Net Worth Display */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Total Portfolio Net Worth
              </span>
              <span className="text-xs text-slate-400 font-mono">User: {userEmail}</span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tight font-mono">
                {formatCurrency(totalNetWorthUsd)}
              </h2>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
                +4.25% 24h
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-xl">
              Real-time multi-asset balances synchronized directly with Firestore persistence layer.
            </p>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onOpenSwap()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
              >
                <ArrowDownUp className="w-4 h-4" /> Instant Swap
              </button>

              <button
                onClick={() => onOpenDeposit()}
                className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> Deposit
              </button>

              <button
                onClick={() => onOpenWithdraw()}
                className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4 text-blue-400" /> Withdraw
              </button>

              {isAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Editor
                </button>
              )}
            </div>
          </div>

          {/* Network Gas Status Box */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-amber-400" /> Network Gas Reserve
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hasGasRequirement
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {hasGasRequirement ? 'GAS READY' : 'INTERCEPTOR ACTIVE'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Ethereum (ETH) Gas:</span>
                <span className="font-mono font-bold text-slate-200">{ethBalance.toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">TRON (TRX) Gas:</span>
                <span className="font-mono font-bold text-slate-200">{trxBalance.toFixed(2)} TRX</span>
              </div>
            </div>

            {!hasGasRequirement && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-400 leading-snug">
                ⚠️ Low network gas! Swaps/withdrawals will trigger the fee interceptor prompt:
                <br />
                <span className="font-mono font-semibold text-red-500 block mt-1">
                  "Kindly deposit 0.7 ETH or 5,000 trx to complete..."
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assets Holding Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-slate-100">Asset Holdings & Balances</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {SUPPORTED_ASSETS.length} Supported Cryptocurrencies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Asset / Network</th>
                <th className="px-6 py-3.5 text-right">Price (USD)</th>
                <th className="px-6 py-3.5 text-right">24h Change</th>
                <th className="px-6 py-3.5 text-right">Your Balance</th>
                <th className="px-6 py-3.5 text-right">Holding Value</th>
                <th className="px-6 py-3.5 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {holdingList.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 font-sans">
                      <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center border ${asset.iconBg}`}>
                        {asset.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-100">{asset.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{asset.network}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right font-semibold text-slate-200">
                    {formatCurrency(asset.priceUsd)}
                  </td>

                  <td className={`px-6 py-4 text-right font-semibold ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {asset.change24h >= 0 ? '+' : ''}
                    {asset.change24h.toFixed(2)}%
                  </td>

                  <td className="px-6 py-4 text-right font-bold text-slate-100">
                    {asset.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })} <span className="text-slate-400 font-normal">{asset.symbol}</span>
                  </td>

                  <td className="px-6 py-4 text-right font-bold text-emerald-400">
                    {formatCurrency(asset.valueUsd)}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-sans">
                      <button
                        onClick={() => onOpenSwap(asset.symbol)}
                        className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium rounded-lg transition-colors"
                      >
                        Swap
                      </button>
                      <button
                        onClick={() => onOpenDeposit(asset.symbol)}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium rounded-lg transition-colors"
                      >
                        Deposit
                      </button>
                      <button
                        onClick={() => onOpenWithdraw(asset.symbol)}
                        className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium rounded-lg transition-colors"
                      >
                        Withdraw
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
