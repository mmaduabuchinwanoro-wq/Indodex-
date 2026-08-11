import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Globe,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, SUPPORTED_COUNTRIES } from '../context/LanguageContext';
import { SUPPORTED_ASSETS, getAssetBySymbol, formatCurrency } from '../data/cryptoAssets';
import { updateBalanceByEmail, logTransaction } from '../services/adminService';
import { AssetIcon } from './AssetIcon';

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
}

export const BuyModal: React.FC<BuyModalProps> = ({
  isOpen,
  onClose,
  initialSymbol = 'USDT (ERC-20)',
}) => {
  const { userEmail, balances, userAccount, refreshAccountData } = useAuth();
  const { selectedCountry, t, formatLocalFiat } = useLanguage();

  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [fiatAmountUsd, setFiatAmountUsd] = useState<string>('250');
  const [selectedGateway, setSelectedGateway] = useState<'indodex' | 'moonpay' | 'transak' | 'banxa'>('indodex');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'card' | 'bank_transfer' | 'e_wallet'>('qris');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [buySuccess, setBuySuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAsset = getAssetBySymbol(symbol) || SUPPORTED_ASSETS[1];
  const parsedUsd = parseFloat(fiatAmountUsd) || 0;
  const cryptoReceived = parsedUsd > 0 ? parsedUsd / currentAsset.priceUsd : 0;

  const handleConfirmPurchase = async () => {
    if (parsedUsd < 10) {
      alert('Minimum purchase amount is $10.');
      return;
    }

    setIsProcessing(true);
    setBuySuccess(false);

    try {
      if (userAccount) {
        const currentBal = balances[symbol] || 0;
        const newBal = currentBal + cryptoReceived;

        await updateBalanceByEmail(userEmail, symbol, newBal, `Fiat Buy (${selectedGateway.toUpperCase()})`);

        await logTransaction({
          userId: userAccount.uid,
          userEmail,
          type: 'deposit',
          fromSymbol: selectedCountry.fiat,
          fromAmount: parsedUsd * selectedCountry.exchangeRateToUsd,
          toSymbol: symbol,
          toAmount: cryptoReceived,
          amountUsd: parsedUsd,
          feeUsd: parsedUsd * 0.015, // 1.5% gateway fee
          status: 'completed',
          timestamp: new Date().toISOString(),
          note: `Purchased ${cryptoReceived.toFixed(6)} ${symbol} via ${selectedGateway.toUpperCase()} (${paymentMethod.toUpperCase()})`,
        });

        await refreshAccountData();
        setBuySuccess(true);
      }
    } catch (err) {
      console.error('Buy error:', err);
      alert('Failed to execute purchase.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{t('buyHeader')}</h2>
              <p className="text-xs text-slate-400">{t('buySubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {buySuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">Purchase Completed!</h3>
                <p className="text-xs text-slate-400">
                  You have successfully bought{' '}
                  <strong className="text-emerald-400 font-mono">
                    {cryptoReceived.toFixed(6)} {symbol}
                  </strong>
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
              >
                Return to Wallet
              </button>
            </div>
          ) : (
            <>
              {/* Select Crypto Asset */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Cryptocurrency to Receive</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUPPORTED_ASSETS.slice(0, 6).map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setSymbol(asset.symbol)}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                        symbol === asset.symbol
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <AssetIcon symbol={asset.symbol} size="sm" />
                      <div className="truncate">
                        <p className="font-bold text-xs">{asset.symbol}</p>
                        <p className="text-[10px] text-slate-400 truncate">{formatCurrency(asset.priceUsd)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enter Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">Purchase Amount</label>
                  <span className="text-[11px] text-indigo-400 font-mono">
                    ≈ {formatLocalFiat(parsedUsd)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={fiatAmountUsd}
                    onChange={(e) => setFiatAmountUsd(e.target.value)}
                    placeholder="Enter amount in USD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="absolute right-3 top-3 text-xs font-bold text-slate-400 uppercase font-mono">
                    USD
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Estimated Crypto:</span>
                  <span className="font-bold font-mono text-emerald-400 text-sm">
                    {cryptoReceived.toFixed(6)} {symbol}
                  </span>
                </div>
              </div>

              {/* Select Payment Gateway */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Payment Gateway Partner</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedGateway('indodex')}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                      selectedGateway === 'indodex'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-xs text-slate-200">INDODEX IDR Gateway</p>
                      <p className="text-[10px] text-slate-400">QRIS, BCA, Mandiri, OVO</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedGateway('moonpay')}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                      selectedGateway === 'moonpay'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-xs text-slate-200">MoonPay Global</p>
                      <p className="text-[10px] text-slate-400">Visa, Mastercard, Apple Pay</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedGateway('transak')}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                      selectedGateway === 'transak'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-xs text-slate-200">Transak Onramp</p>
                      <p className="text-[10px] text-slate-400">SEPA, Bank Transfer, Cards</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedGateway('banxa')}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                      selectedGateway === 'banxa'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-purple-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-xs text-slate-200">Banxa / Ramp</p>
                      <p className="text-[10px] text-slate-400">Instant Direct Settlement</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Execute Purchase Button */}
              <button
                onClick={handleConfirmPurchase}
                disabled={isProcessing || parsedUsd <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing Gateway Order...</span>
                ) : (
                  <>
                    <span>Confirm & Buy {symbol}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-500">
                🔒 Protected by 256-bit SSL Gateway Encryption & Atomic Settlement
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
