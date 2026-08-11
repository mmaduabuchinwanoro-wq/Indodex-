import React from 'react';

interface AssetIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AssetIcon: React.FC<AssetIconProps> = ({ symbol, size = 'md', className = '' }) => {
  const sym = symbol.toUpperCase();

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const iconSize = sizeClasses[size];

  if (sym.includes('BTC')) {
    return (
      <div
        className={`${iconSize} rounded-full bg-[#F7931A] text-white font-bold flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 ${className}`}
      >
        <svg className="w-3/5 h-3/5 fill-current" viewBox="0 0 24 24">
          <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.7 8.475-1.21 14.9.395c6.43 1.605 10.34 8.115 8.738 14.509zm-6.36-4.66c.28-1.87-1.144-2.875-3.093-3.548l.632-2.532-1.54-.384-.616 2.47c-.404-.102-.82-.198-1.233-.294l.62-2.484-1.542-.384-.633 2.534c-.335-.077-.663-.153-.984-.233l.002-.008-2.128-.532-.41 1.648s1.145.262 1.12.28c.626.156.739.57.72.9l-.72 2.887c.043.01.098.026.16.05-.05-.013-.105-.027-.158-.04l-1.01 4.043c-.077.19-.272.476-.713.367.016.024-1.12-.28-1.12-.28l-.768 1.77 2.008.501c.373.093.738.192 1.1.288l-.64 2.568 1.54.384.632-2.532c.42.115.827.22 1.226.32l-.63 2.525 1.542.385.642-2.568c2.635.498 4.618.298 5.452-2.086.672-1.92-.033-3.028-1.422-3.748 1.01-.234 1.77-.9 1.972-2.278zm-3.53 4.975c-.478 1.92-3.71.882-4.757.622l.85-3.402c1.047.26 4.394.778 3.907 2.78zm.48-4.997c-.435 1.745-3.13.858-4.004.64l.77-3.088c.875.218 3.677.625 3.234 2.448z" />
        </svg>
      </div>
    );
  }

  if (sym.includes('USDT')) {
    return (
      <div
        className={`${iconSize} rounded-full bg-[#26A17B] text-white font-bold flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 ${className}`}
      >
        <span className="font-extrabold tracking-tighter">₮</span>
      </div>
    );
  }

  if (sym.includes('ETH')) {
    return (
      <div
        className={`${iconSize} rounded-full bg-[#627EEA] text-white font-bold flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 ${className}`}
      >
        <svg className="w-3/5 h-3/5 fill-current" viewBox="0 0 24 24">
          <path d="M11.999 0l-6.62 11.012 6.62 3.903 6.617-3.903zM11.999 16.14l-6.62-3.902 6.62 9.762 6.617-9.762z" />
        </svg>
      </div>
    );
  }

  if (sym.includes('TRX')) {
    return (
      <div
        className={`${iconSize} rounded-full bg-[#FF0013] text-white font-bold flex items-center justify-center shadow-md shadow-red-500/20 shrink-0 ${className}`}
      >
        <svg className="w-3/5 h-3/5 fill-current" viewBox="0 0 24 24">
          <path d="M2.25 2.25l19.5 5.25-10.5 14.25L2.25 2.25zm4.5 4.5l2.25 9 6-8.25-8.25-.75z" />
        </svg>
      </div>
    );
  }

  if (sym.includes('BNB')) {
    return (
      <div
        className={`${iconSize} rounded-full bg-[#F3BA2F] text-slate-950 font-extrabold flex items-center justify-center shadow-md shadow-yellow-500/20 shrink-0 ${className}`}
      >
        <svg className="w-3/5 h-3/5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0l4.24 4.24-4.24 4.24-4.24-4.24L12 0zm0 15.52l4.24 4.24-4.24 4.24-4.24-4.24 4.24-4.24zm-7.76-7.76L8.48 12 4.24 16.24 0 12l4.24-4.24zm15.52 0L24 12l-4.24 4.24L15.52 12l4.24-4.24zM12 8.48L15.52 12 12 15.52 8.48 12 12 8.48z" />
        </svg>
      </div>
    );
  }

  if (sym.includes('TON')) {
    return (
      <div
        className={`${iconSize} rounded-full bg-[#0098EA] text-white font-bold flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0 ${className}`}
      >
        <svg className="w-3/5 h-3/5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2L2 8.5l10 13.5 10-13.5L12 2zm0 3.5l6.5 4.25L12 18.5l-6.5-8.75L12 5.5z" />
        </svg>
      </div>
    );
  }

  if (sym.includes('SOL')) {
    return (
      <div
        className={`${iconSize} rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-teal-400 text-white font-bold flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0 ${className}`}
      >
        <span className="font-extrabold tracking-tighter text-xs">SOL</span>
      </div>
    );
  }

  if (sym.includes('ETC')) {
    return (
      <div
        className={`${iconSize} rounded-full bg-[#328332] text-white font-bold flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0 ${className}`}
      >
        <svg className="w-3/5 h-3/5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0l-6 10 6 3 6-3-6-10zm0 14l-6-3 6 9 6-9-6 3z" />
        </svg>
      </div>
    );
  }

  if (sym.includes('HMSTR')) {
    return (
      <div
        className={`${iconSize} rounded-full bg-[#FF6B00] text-white font-bold flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0 ${className}`}
      >
        <span className="font-extrabold text-[10px]">🐹</span>
      </div>
    );
  }

  // Generic fallback
  return (
    <div
      className={`${iconSize} rounded-full bg-slate-800 text-indigo-400 font-bold border border-slate-700 flex items-center justify-center shrink-0 ${className}`}
    >
      {sym.slice(0, 3)}
    </div>
  );
};
