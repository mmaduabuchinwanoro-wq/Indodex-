import React from 'react';
import { SUPPORTED_ASSETS, formatCurrency } from '../data/cryptoAssets';
import { useAuth } from '../context/AuthContext';
import { ArrowDownUp, ArrowDownLeft, ArrowUpRight, Fuel, ShieldAlert } from 'lucide-react';

interface AssetListProps {
  onOpenSwap: (symbol: string) => void;
  onOpenDeposit: (symbol: string) => void;
  onOpenWithdraw: (symbol: string) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  onOpenSwap,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const { balances } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Supported Crypto Assets & Live Rates</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time market rates, network standards, gas dependencies, and wallet balance overview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SUPPORTED_ASSETS.map((asset) => {
          const userBal = balances[asset.symbol] || 0;
          const userUsdVal = userBal * asset.priceUsd;

          return (
            <div
              key={asset.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-xl"
            >
              <div className="space-y-3">
                {/* Asset Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border ${asset.iconBg}`}
                    >
                      {asset.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-100">{asset.name}</h3>
                      <span className="text-xs font-semibold text-slate-400 font-mono">
                        {asset.symbol}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                      asset.change24h >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {asset.change24h >= 0 ? '+' : ''}
                    {asset.change24h.toFixed(2)}%
                  </span>
                </div>

                {/* Network & Gas tag */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                    {asset.network}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono flex items-center gap-1">
                    <Fuel className="w-3 h-3" /> Gas: {asset.gasAssetSymbol}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {asset.description}
                </p>

                {/* Price & Balance Stats */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Live Market Price:</span>
                    <span className="font-mono font-bold text-slate-100">
                      {formatCurrency(asset.priceUsd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/60 pt-2">
                    <span>Your Balance:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {userBal.toLocaleString('en-US', { maximumFractionDigits: 6 })} {asset.symbol} ({formatCurrency(userUsdVal)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Triggers */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => onOpenSwap(asset.symbol)}
                  className="py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowDownUp className="w-3.5 h-3.5" /> Swap
                </button>
                <button
                  onClick={() => onOpenDeposit(asset.symbol)}
                  className="py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
                </button>
                <button
                  onClick={() => onOpenWithdraw(asset.symbol)}
                  className="py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
