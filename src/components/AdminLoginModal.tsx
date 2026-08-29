import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  X, 
  KeyRound, 
  AlertCircle, 
  ArrowRight
} from 'lucide-react';
import { AdminUser } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getStoredPin = () => {
    return localStorage.getItem('trk_admin_pin') || '7777';
  };

  useEffect(() => {
    if (isOpen) {
      setPinCode('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getStoredPin();

    if (pinCode === correctPin) {
      const user: AdminUser = {
        email: 'owner@track-workshop.ua',
        name: 'Власник Майстерні',
        loginMethod: 'pin',
        loggedInAt: new Date().toISOString()
      };
      onLogin(user);
      onClose();
    } else {
      setErrorMsg('Невірний PIN-код. Перевірте введені дані та спробуйте ще раз.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white p-6 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/25">
            <Lock className="w-7 h-7" />
          </div>
          
          <h2 className="text-xl font-bold font-serif text-white">Вхід до кабінету власника</h2>
          <p className="text-xs text-slate-300 mt-1">
            Для створення, редагування та видалення товарів
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handlePinLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Введіть PIN-код доступу
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={12}
                  value={pinCode}
                  onChange={(e) => {
                    setPinCode(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="••••"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center tracking-[0.4em] font-mono text-xl font-bold text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errorMsg && (
                <p className="text-rose-500 text-xs mt-2 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer mt-2"
            >
              <span>Увійти як власник</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
