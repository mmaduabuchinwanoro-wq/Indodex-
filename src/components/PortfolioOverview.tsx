import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Eye,
  EyeOff,
  Search,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Bell,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORTED_ASSETS, formatCurrency } from '../data/cryptoAssets';
import { AssetIcon } from './AssetIcon';

interface PortfolioOverviewProps {
  onOpenSwap: (symbol?: string) => void;
  onOpenDeposit: (symbol?: string) => void;
  onOpenWithdraw: (symbol?: string) => void;
  onOpenBuy: (symbol?: string) => void;
  onOpenAdmin: () => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  onOpenSwap,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenBuy,
  onOpenAdmin,
}) => {
  const { balances, userEmail, isAdmin, platformSettings, isAddressNoticeDismissed, dismissAddressNotice } = useAuth();
  const { selectedCountry, t, formatLocalFiat } = useLanguage();

  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredAssets = holdingList.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.network.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Broadcast Platform Update Notice Banner */}
      {platformSettings?.lastAddressUpdateNotice && !isAddressNoticeDismissed && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-amber-400">
                Official Wallet Address Notice
              </p>
              <p className="text-xs text-amber-200/90 leading-snug">
                {platformSettings.lastAddressUpdateNotice.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => onOpenDeposit()}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
            >
              View Deposit Addresses
            </button>
            <button
              onClick={dismissAddressNotice}
              className="p-1.5 text-amber-400 hover:text-amber-200 hover:bg-amber-500/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Mobile-Style Wallet Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Main Balance Display */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-indigo-400" /> {t('totalBalance')}
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title={showBalance ? t('hideBalance') : t('showBalance')}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tight font-mono">
                {showBalance ? formatCurrency(totalNetWorthUsd) : '•••••••••'}
              </h2>
              {showBalance && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
                  +3.53% 24h
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
              <span>≈ {showBalance ? formatLocalFiat(totalNetWorthUsd) : '•••••••••'}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-sans">
                {selectedCountry.flag} {selectedCountry.name} ({selectedCountry.fiat})
              </span>
            </div>
          </div>

          {/* Prominent Action Bar Buttons (Send, Receive, Swap, Buy) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 shrink-0">
            {/* Send (Withdraw) */}
            <button
              onClick={() => onOpenWithdraw()}
              className="flex flex-col items-center justify-center p-3 sm:px-4 sm:py-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">{t('withdraw')}</span>
            </button>

            {/* Receive (Deposit) */}
            <button
              onClick={() => onOpenDeposit()}
              className="flex flex-col items-center justify-center p-3 sm:px-4 sm:py-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">{t('deposit')}</span>
            </button>

            {/* Instant Swap */}
            <button
              onClick={() => onOpenSwap()}
              className="flex flex-col items-center justify-center p-3 sm:px-4 sm:py-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <ArrowDownUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">{t('swap')}</span>
            </button>

            {/* Buy Gateway */}
            <button
              onClick={() => onOpenBuy()}
              className="flex flex-col items-center justify-center p-3 sm:px-4 sm:py-3 bg-gradient-to-tr from-emerald-600/20 via-indigo-600/20 to-indigo-600/30 hover:from-emerald-600/30 hover:to-indigo-600/40 border border-emerald-500/30 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-300">{t('buy')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Asset Holdings Table & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-slate-100">{t('allAssets')}</h3>
          </div>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchAssets')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">24h Change</th>
                <th className="px-4 py-3 text-right">Your Balance</th>
                <th className="px-4 py-3 text-right">Holding Value</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3 font-sans">
                      <AssetIcon symbol={asset.symbol} size="md" />
                      <div>
                        <div className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                          {asset.name}
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                            {asset.symbol}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{asset.network}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-right font-semibold text-slate-200">
                    {formatCurrency(asset.priceUsd)}
                  </td>

                  <td className={`px-4 py-3.5 text-right font-semibold ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {asset.change24h >= 0 ? '+' : ''}
                    {asset.change24h.toFixed(2)}%
                  </td>

                  <td className="px-4 py-3.5 text-right font-bold text-slate-100">
                    {showBalance ? (
                      <>
                        {asset.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })}{' '}
                        <span className="text-slate-400 font-normal">{asset.symbol}</span>
                      </>
                    ) : (
                      '••••••'
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                    {showBalance ? formatCurrency(asset.valueUsd) : '••••••'}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-sans">
                      <button
                        onClick={() => onOpenSwap(asset.symbol)}
                        className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium rounded-lg transition-colors"
                      >
                        Swap
                      </button>
                      <button
                        onClick={() => onOpenBuy(asset.symbol)}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium rounded-lg transition-colors"
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => onOpenDeposit(asset.symbol)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium rounded-lg transition-colors"
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
