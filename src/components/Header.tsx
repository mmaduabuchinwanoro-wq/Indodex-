import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownUp,
  ShieldCheck,
  History,
  Coins,
  TrendingUp,
  UserCheck,
  ChevronDown,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_ASSETS, formatCurrency } from '../data/cryptoAssets';

interface HeaderProps {
  activeTab: 'portfolio' | 'assets' | 'admin' | 'history';
  setActiveTab: (tab: 'portfolio' | 'assets' | 'admin' | 'history') => void;
  onOpenSwap: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSwap,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const { userEmail, isAdmin, signInAsDemoUser, signOutUser } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Ticker Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/40 px-4 py-1.5 overflow-x-auto whitespace-nowrap text-xs flex items-center gap-6 scrollbar-none">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
          <TrendingUp className="w-3 h-3" /> Live Market Feed
        </span>
        {SUPPORTED_ASSETS.slice(0, 6).map((asset) => (
          <div key={asset.id} className="flex items-center gap-1.5 font-mono text-slate-300">
            <span className="font-semibold text-slate-200">{asset.symbol}</span>
            <span>{formatCurrency(asset.priceUsd)}</span>
            <span className={asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {asset.change24h >= 0 ? '+' : ''}
              {asset.change24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-indigo-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-100 tracking-tight">
                INDODEX <span className="text-indigo-400 font-normal">WALLET</span>
              </h1>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold hidden sm:inline-block">
                Jakarta, Indonesia
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Jakarta, Indonesia • Multi-Asset Crypto Exchange & Vault
            </p>
          </div>
        </div>

        {/* Center Nav Buttons */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'portfolio'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" /> Portfolio
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'assets'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" /> All Assets
          </button>

          <button
            onClick={onOpenSwap}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-indigo-400" /> Instant Swap
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" /> History
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Admin Panel
            </button>
          )}
        </nav>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDeposit}
            className="hidden sm:flex px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg transition-colors items-center gap-1.5"
          >
            Deposit
          </button>

          <button
            onClick={onOpenWithdraw}
            className="hidden sm:flex px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-lg transition-colors items-center gap-1.5"
          >
            Withdraw
          </button>

          {/* User Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px] font-mono">
                {userEmail.slice(0, 2).toUpperCase()}
              </div>
              <span className="max-w-[120px] sm:max-w-[160px] truncate font-mono">{userEmail}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2 animate-in fade-in duration-150">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</span>
                    {isAdmin && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold font-mono text-slate-100 truncate">{userEmail}</p>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="px-3 py-2 text-xs text-slate-400 flex flex-col gap-1 border-b border-slate-800/80 pb-2">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Support Email</span>
                    <a
                      href="mailto:indodexsupport@gmail.com"
                      className="text-indigo-400 hover:underline font-mono text-[11px] truncate"
                    >
                      indodexsupport@gmail.com
                    </a>
                  </div>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          signInAsDemoUser('indodexsupport@gmail.com');
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-indigo-300 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors font-mono"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Switch to indodexsupport@gmail.com
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors font-mono"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Admin Control Center
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      signOutUser();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors font-mono"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
