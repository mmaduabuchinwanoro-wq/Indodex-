import React, { useState } from 'react';
import { X, Copy, Check, QrCode, ShieldAlert, ArrowDownLeft, Clock, Send } from 'lucide-react';
import { SUPPORTED_ASSETS, getAssetBySymbol } from '../data/cryptoAssets';
import { useAuth } from '../context/AuthContext';
import { updateBalanceByEmail, logTransaction } from '../services/adminService';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  initialSymbol = 'USDT (TRC-20)',
}) => {
  const { userEmail, balances, userAccount, refreshAccountData, globalAddresses } = useAuth();
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedAmount, setSimulatedAmount] = useState<string>('500');
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAsset = getAssetBySymbol(symbol) || SUPPORTED_ASSETS[1];
  const liveAddress = globalAddresses[symbol] || currentAsset.depositAddress;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(liveAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUserSubmitPendingDeposit = async () => {
    const amountToCredit = parseFloat(simulatedAmount) || 500;
    setIsSimulating(true);
    setPendingNotice(null);

    try {
      if (userAccount) {
        await logTransaction({
          userId: userAccount.uid,
          userEmail,
          type: 'deposit',
          toSymbol: symbol,
          toAmount: amountToCredit,
          amountUsd: amountToCredit * currentAsset.priceUsd,
          feeUsd: 0,
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: `Pending Admin Verification: User notified deposit of ${amountToCredit} ${symbol} to address ${liveAddress.slice(0, 8)}...`,
        });

        await refreshAccountData();
        setPendingNotice(`Deposit request of ${amountToCredit} ${symbol} submitted! It is currently in Pending status awaiting admin verification and approval.`);
      }
    } catch (err) {
      console.error('Deposit notification error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleInstantDirectDeposit = async () => {
    const amountToCredit = parseFloat(simulatedAmount) || 500;
    setIsSimulating(true);

    try {
      if (userAccount) {
        const currentBal = balances[symbol] || 0;
        const newBal = currentBal + amountToCredit;

        await updateBalanceByEmail(userEmail, symbol, newBal, 'User Direct Deposit');

        await logTransaction({
          userId: userAccount.uid,
          userEmail,
          type: 'deposit',
          toSymbol: symbol,
          toAmount: amountToCredit,
          amountUsd: amountToCredit * currentAsset.priceUsd,
          feeUsd: 0,
          status: 'completed',
          timestamp: new Date().toISOString(),
          note: `Instant credited top-up deposit of ${amountToCredit} ${symbol}`,
        });

        await refreshAccountData();
        alert(`Successfully credited +${amountToCredit} ${symbol} to your balance!`);
        onClose();
      }
    } catch (err) {
      console.error('Direct deposit error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100">Deposit Crypto</h3>
              <p className="text-xs text-slate-400">Receive funds to your wallet balance</p>
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
          {pendingNotice && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Pending Approval Queue</span>
              </div>
              <p className="text-xs text-amber-300/90 leading-relaxed font-mono">
                {pendingNotice}
              </p>
            </div>
          )}

          {/* ASSET SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Select Deposit Asset</label>
            <select
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                setPendingNotice(null);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 font-semibold text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {SUPPORTED_ASSETS.map((asset) => (
                <option key={asset.id} value={asset.symbol}>
                  {asset.name} ({asset.symbol}) — {asset.network}
                </option>
              ))}
            </select>
          </div>

          {/* QR CODE & ADDRESS BOX */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
              {/* QR Code SVG Visual */}
              <div className="w-36 h-36 bg-white flex items-center justify-center relative p-1">
                <QrCode className="w-full h-full text-slate-900" />
              </div>
            </div>

            <div className="w-full space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Your {currentAsset.symbol} Deposit Address:</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Global Address
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                <span className="text-xs font-mono text-emerald-400 truncate flex-1 font-semibold">
                  {liveAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="w-full flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-left">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Send only <strong>{currentAsset.symbol}</strong> via <strong>{currentAsset.network}</strong> network. Sending any other currency may result in permanent loss.
              </span>
            </div>
          </div>

          {/* DEPOSIT ACTION CONTROLS */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">
              Confirm Sent Deposit Amount
            </span>
            <div className="flex gap-2">
              <input
                type="number"
                value={simulatedAmount}
                onChange={(e) => setSimulatedAmount(e.target.value)}
                placeholder="Amount sent..."
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleUserSubmitPendingDeposit}
                disabled={isSimulating}
                className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> Submit Deposit (Pending)
              </button>
              <button
                onClick={handleInstantDirectDeposit}
                disabled={isSimulating}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                Instant Credit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
