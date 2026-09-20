import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storage';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  currentStoredPin?: string;
  onSavePin?: (newPin: string) => Promise<void> | void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentStoredPin,
  onSavePin
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getStoredPin = () => {
    return currentStoredPin || safeLocalStorageGet<string>('trk_admin_pin', '7777');
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setErrorMsg('');
      setShowPins(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getStoredPin();

    if (currentPin.trim() !== storedPin.trim()) {
      setErrorMsg('Поточний PIN-код введено невірно');
      return;
    }

    if (newPin.trim().length < 4) {
      setErrorMsg('Новий PIN-код повинен містити щонайменше 4 символи');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg('Новий PIN-код та підтвердження не збігаються');
      return;
    }

    if (newPin.trim() === currentPin.trim()) {
      setErrorMsg('Новий PIN-код повинен відрізнятися від поточного');
      return;
    }

    setIsSaving(true);
    try {
      const cleanPin = newPin.trim();
      safeLocalStorageSet('trk_admin_pin', cleanPin);
      if (onSavePin) {
        await onSavePin(cleanPin);
      }
      onSuccess('PIN-код доступу успішно оновлено та синхронізовано!');
      onClose();
    } catch (err) {
      console.error('Failed to save PIN:', err);
      setErrorMsg('Помилка при збереженні PIN-коду. Спробуйте ще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-white">Зміна PIN-коду доступу</h2>
              <p className="text-xs text-slate-300">
                Безпека кабінету власника
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Current PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Поточний PIN-код
            </label>
            <div className="relative">
              <input
                type={showPins ? "text" : "password"}
                maxLength={12}
                value={currentPin}
                onChange={(e) => {
                  setCurrentPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Введіть старий PIN"
                autoFocus
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* New PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Новий PIN-код (мін. 4 знаки)
            </label>
            <div className="relative">
              <input
                type={showPins ? "text" : "password"}
                maxLength={12}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Введіть новий PIN"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Confirm New PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Підтвердіть новий PIN-код
            </label>
            <div className="relative">
              <input
                type={showPins ? "text" : "password"}
                maxLength={12}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Повторіть новий PIN"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Toggle PIN visibility */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPins ? 'Приховати символи' : 'Показати символи'}</span>
            </button>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Збереження...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Зберегти PIN</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
