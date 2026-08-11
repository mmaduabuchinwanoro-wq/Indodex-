import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Check, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { signInAsDemoUser, isAdmin } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Accept Master PIN '8888' or '9999' or signing in as indodexsupport@gmail.com
    if (pin === '8888' || pin === '9999' || pin.toLowerCase() === 'indodexsupport@gmail.com') {
      await signInAsDemoUser('indodexsupport@gmail.com');
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Invalid Security PIN. Access Denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Administrator Portal</h3>
              <p className="text-[11px] text-slate-400">Secure Vault Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Enter Master Admin Security PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN (e.g. 8888)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            {errorMsg && <p className="text-xs font-semibold text-red-400 text-center">{errorMsg}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" /> Verify & Access Admin
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-500 font-mono">
          Master Default Admin PIN: <strong className="text-slate-400">8888</strong>
        </p>
      </div>
    </div>
  );
};
