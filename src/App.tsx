import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/Header';
import { PortfolioOverview } from './components/PortfolioOverview';
import { AssetList } from './components/AssetList';
import { AdminPanel } from './components/AdminPanel';
import { TransactionHistory } from './components/TransactionHistory';
import { SwapModal } from './components/SwapModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { BuyModal } from './components/BuyModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AuthModal } from './components/AuthModal';
import { ShieldCheck, Globe, Coins } from 'lucide-react';

function AppContent() {
  const { userEmail, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'portfolio' | 'assets' | 'admin' | 'history'>('portfolio');

  // Modal controls
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  const [isSwapOpen, setIsSwapOpen] = useState<boolean>(false);
  const [swapFromSymbol, setSwapFromSymbol] = useState<string>('USDT (TRC-20)');

  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [depositSymbol, setDepositSymbol] = useState<string>('ETH');

  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [withdrawSymbol, setWithdrawSymbol] = useState<string>('USDT (ERC-20)');

  const [isBuyOpen, setIsBuyOpen] = useState<boolean>(false);
  const [buySymbol, setBuySymbol] = useState<string>('USDT (ERC-20)');

  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);

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

  const handleOpenBuy = (symbol?: string) => {
    if (symbol) setBuySymbol(symbol);
    setIsBuyOpen(true);
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
        onOpenBuy={() => handleOpenBuy()}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'portfolio' && (
          <PortfolioOverview
            onOpenSwap={(sym) => handleOpenSwap(sym)}
            onOpenDeposit={(sym) => handleOpenDeposit(sym)}
            onOpenWithdraw={(sym) => handleOpenWithdraw(sym)}
            onOpenBuy={(sym) => handleOpenBuy(sym)}
            onOpenAdmin={() => {
              if (isAdmin) {
                setActiveTab('admin');
              } else {
                setIsAdminAuthOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'assets' && (
          <AssetList
            onOpenSwap={(sym) => handleOpenSwap(sym)}
            onOpenDeposit={(sym) => handleOpenDeposit(sym)}
            onOpenWithdraw={(sym) => handleOpenWithdraw(sym)}
          />
        )}

        {activeTab === 'admin' && (
          isAdmin ? (
            <AdminPanel />
          ) : (
            <PortfolioOverview
              onOpenSwap={(sym) => handleOpenSwap(sym)}
              onOpenDeposit={(sym) => handleOpenDeposit(sym)}
              onOpenWithdraw={(sym) => handleOpenWithdraw(sym)}
              onOpenBuy={(sym) => handleOpenBuy(sym)}
              onOpenAdmin={() => setIsAdminAuthOpen(true)}
            />
          )
        )}

        {activeTab === 'history' && <TransactionHistory />}
      </main>

      {/* Clean Production Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center gap-3 text-slate-400 font-medium">
          <Coins className="w-4 h-4 text-indigo-400" />
          <span>INDODEX WALLET • Multi-Asset Cryptographic Vault</span>
          <span className="text-slate-700">•</span>
          <span className="text-indigo-400 font-mono">Jakarta, Indonesia</span>
        </div>
        <p className="text-slate-500">
          © 2026 INDODEX WALLET. All rights reserved. Support:{' '}
          <a href="mailto:indodexsupport@gmail.com" className="text-indigo-400 hover:underline">
            indodexsupport@gmail.com
          </a>
        </p>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <SwapModal
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        initialFromSymbol={swapFromSymbol}
        onOpenDepositForGas={(gasSymbol) => handleOpenDeposit(gasSymbol)}
        onOpenAuth={() => setIsAuthOpen(true)}
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
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <BuyModal
        isOpen={isBuyOpen}
        onClose={() => setIsBuyOpen(false)}
        initialSymbol={buySymbol}
      />

      <AdminLoginModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => setActiveTab('admin')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
