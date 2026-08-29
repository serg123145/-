import React, { useEffect } from 'react';
import { 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  X 
} from 'lucide-react';

export interface NotificationToastProps {
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type = 'success',
  duration = 4000,
  onClose
}) => {
  useEffect(() => {
    if (!onClose || duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const getTheme = () => {
    switch (type) {
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
          border: 'border-sky-500/40',
          bg: 'bg-slate-900/95',
          accent: 'text-sky-400',
          title: 'Інформація'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          border: 'border-amber-500/40',
          bg: 'bg-slate-900/95',
          accent: 'text-amber-400',
          title: 'Увага'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          border: 'border-rose-500/40',
          bg: 'bg-slate-900/95',
          accent: 'text-rose-400',
          title: 'Помилка'
        };
      case 'success':
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          border: 'border-emerald-500/40',
          bg: 'bg-slate-900/95',
          accent: 'text-emerald-400',
          title: 'Успішно'
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <div 
        className={`pointer-events-auto p-4 rounded-2xl ${theme.bg} ${theme.border} text-white shadow-2xl border backdrop-blur-md flex items-start gap-3 transition-all duration-300 transform translate-y-0`}
        role="alert"
      >
        <div className="mt-0.5">
          {theme.icon}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${theme.accent}`}>
            {theme.title}
          </p>
          <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed break-words">
            {message}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити сповіщення"
            className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

