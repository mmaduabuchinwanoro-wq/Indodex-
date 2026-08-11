import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { PortfolioOverview } from './components/PortfolioOverview';
import { AssetList } from './components/AssetList';
import { AdminPanel } from './components/AdminPanel';
import { TransactionHistory } from './components/TransactionHistory';
import { SwapModal } from './components/SwapModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { ShieldCheck, Database, Zap } from 'lucide-react';

function AppContent() {
  const { userEmail, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'portfolio' | 'assets' | 'admin' | 'history'>('portfolio');

  // Modal controls
  const [isSwapOpen, setIsSwapOpen] = useState<boolean>(false);
  const [swapFromSymbol, setSwapFromSymbol] = useState<string>('USDT (TRC-20)');

  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [depositSymbol, setDepositSymbol] = useState<string>('ETH');

  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [withdrawSymbol, setWithdrawSymbol] = useState<string>('USDT (ERC-20)');

  const handleOpenSwap = (symbol?: string) => {
    if (symbol) setSwapFromSymbol(symbol);
    setIsSwapOpen(true);
  };

  const handleOpenDeposit = (symbol?: string) => {
    if (symbol) setDepositSymbol(symbol);
    setIsDepositOpen(true);
  };

  const handleOpenWithdraw = (symbol?: string) => {
    if (symbol) setWithdrawSymbol(symbol);
    setIsWithdrawOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSwap={() => handleOpenSwap()}
        onOpenDeposit={() => handleOpenDeposit()}
        onOpenWithdraw={() => handleOpenWithdraw()}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'portfolio' && (
          <PortfolioOverview
            onOpenSwap={(sym) => handleOpenSwap(sym)}
            onOpenDeposit={(sym) => handleOpenDeposit(sym)}
            onOpenWithdraw={(sym) => handleOpenWithdraw(sym)}
            onOpenAdmin={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'assets' && (
          <AssetList
            onOpenSwap={(sym) => handleOpenSwap(sym)}
            onOpenDeposit={(sym) => handleOpenDeposit(sym)}
            onOpenWithdraw={(sym) => handleOpenWithdraw(sym)}
          />
        )}

        {activeTab === 'admin' && (isAdmin ? <AdminPanel /> : <PortfolioOverview onOpenSwap={(sym) => handleOpenSwap(sym)} onOpenDeposit={(sym) => handleOpenDeposit(sym)} onOpenWithdraw={(sym) => handleOpenWithdraw(sym)} onOpenAdmin={() => setActiveTab('admin')} />)}

        {activeTab === 'history' && <TransactionHistory />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-mono">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>INDODEX WALLET (Jakarta, Indonesia) • Firestore Database: <strong className="text-slate-300">ai-studio-df9490aa-343e-41d2-997c-3be0a934c3b0</strong></span>
        </div>
        <p>© 2026 INDODEX WALLET. All rights reserved. Support: <a href="mailto:indodexsupport@gmail.com" className="text-indigo-400 hover:underline">indodexsupport@gmail.com</a></p>
      </footer>

      {/* Modals */}
      <SwapModal
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        initialFromSymbol={swapFromSymbol}
        onOpenDepositForGas={(gasSymbol) => handleOpenDeposit(gasSymbol)}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        initialSymbol={depositSymbol}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        initialSymbol={withdrawSymbol}
        onOpenDepositForGas={(gasSymbol) => handleOpenDeposit(gasSymbol)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
