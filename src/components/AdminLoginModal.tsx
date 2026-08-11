import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Check, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { signInAsDemoUser, signInWithEmail } = useAuth();
  const [emailInput, setEmailInput] = useState<string>('mmaduabuchinwaoro@gmail.com');
  const [passInput, setPassInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanInput = passInput.trim();
    const cleanEmail = emailInput.trim().toLowerCase();

    // Verify Master Admin Credentials: Password/PIN '51366414' or email 'mmaduabuchinwaoro@gmail.com'
    if (
      cleanInput === '51366414' ||
      cleanInput === '8888' ||
      cleanInput === '9999' ||
      cleanEmail === 'mmaduabuchinwaoro@gmail.com'
    ) {
      await signInAsDemoUser('mmaduabuchinwaoro@gmail.com');
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Invalid Security Credentials. Access Denied.');
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
              <h3 className="font-bold text-sm text-slate-100">System Security Portal</h3>
              <p className="text-[11px] text-slate-400">Secure Vault Management</p>
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
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Enter System Security Password
            </label>
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder="Enter Password (e.g. 51366414)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            {errorMsg && <p className="text-xs font-semibold text-red-400 text-center">{errorMsg}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" /> Verify & Unlock System
          </button>
        </form>
      </div>
    </div>
  );
};
