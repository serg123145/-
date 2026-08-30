import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Zap, 
  Heart, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  Instagram, 
  MessageSquare,
  FileText,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  CreditCard,
  Copy,
  Check
} from 'lucide-react';
import { StoreInfo, TrustBadgeItem } from '../types';
import { DEFAULT_STORE_INFO } from '../data/defaultStoreInfo';

interface StoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInfo: StoreInfo;
  onSave: (newInfo: StoreInfo) => void;
  onReset: () => void;
}

type TabType = 'brand' | 'hero' | 'badges' | 'payment' | 'contacts' | 'footer';

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({
  isOpen,
  onClose,
  currentInfo,
  onSave,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('brand');
  const [formData, setFormData] = useState<StoreInfo>(currentInfo);
  const [compatibilityInput, setCompatibilityInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(JSON.parse(JSON.stringify(currentInfo)));
      setCompatibilityInput('');
    }
  }, [isOpen, currentInfo]);

  if (!isOpen) return null;

  const handleTextChange = (field: keyof StoreInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBadgeChange = (index: number, field: keyof TrustBadgeItem, value: any) => {
    setFormData(prev => {
      const newBadges = [...prev.trustBadges];
      newBadges[index] = {
        ...newBadges[index],
        [field]: value
      };
      return {
        ...prev,
        trustBadges: newBadges
      };
    });
  };

  const handleAddCompatibilityItem = () => {
    if (!compatibilityInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      compatibilityList: [...prev.compatibilityList, compatibilityInput.trim()]
    }));
    setCompatibilityInput('');
  };

  const handleRemoveCompatibilityItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      compatibilityList: prev.compatibilityList.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleResetDefaults = () => {
    if (confirm('Скинути всі тексти та контактні блоки магазину до стандартних початкових значень?')) {
      setFormData(DEFAULT_STORE_INFO);
      onReset();
    }
  };

  const renderIconSelector = (currentIcon: string, onSelect: (icon: any) => void) => {
    const icons: Array<{ type: TrustBadgeItem['iconType']; label: string; icon: React.ReactNode }> = [
      { type: 'sparkles', label: 'Іскри', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
      { type: 'shield', label: 'Щит', icon: <ShieldCheck className="w-4 h-4 text-blue-400" /> },
      { type: 'truck', label: 'Доставка', icon: <Truck className="w-4 h-4 text-emerald-400" /> },
      { type: 'zap', label: 'Блискавка', icon: <Zap className="w-4 h-4 text-amber-400" /> },
      { type: 'heart', label: 'Серце', icon: <Heart className="w-4 h-4 text-rose-400" /> },
      { type: 'check', label: 'Галочка', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    ];

    return (
      <div className="flex items-center gap-1.5 mt-1">
        {icons.map((ic) => (
          <button
            key={ic.type}
            type="button"
            onClick={() => onSelect(ic.type)}
            className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
              currentIcon === ic.type 
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 ring-2 ring-amber-500/20' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title={ic.label}
          >
            {ic.icon}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-5 sm:p-6 shrink-0 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/25">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                Редагування інформаційних блоків
              </h2>
              <p className="text-xs text-slate-300">
                Зміна назви, описів, банера, контактів та футера
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'brand' 
                ? 'bg-amber-500 text-slate-950 shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Брендинг і шапка</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'hero' 
                ? 'bg-amber-500 text-slate-950 shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Головний банер (Hero)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'badges' 
                ? 'bg-amber-500 text-slate-950 shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Переваги (4 блоки)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payment' 
                ? 'bg-amber-500 text-slate-950 shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Реквізити картки</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'contacts' 
                ? 'bg-amber-500 text-slate-950 shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Контакти і графік</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('footer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'footer' 
                ? 'bg-amber-500 text-slate-950 shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Підвал та бренди</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* TAB 1: BRAND & HEADER */}
          {activeTab === 'brand' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Брендинг магазину:</strong> Налаштуйте логотипний текст, виділення частини назви та слоган у верхній панелі.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Основна частина назви
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => handleTextChange('brandName', e.target.value)}
                    placeholder="Майстерня"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Акцентна частина назви (виділяється кольором)
                  </label>
                  <input
                    type="text"
                    value={formData.brandAccent}
                    onChange={(e) => handleTextChange('brandAccent', e.target.value)}
                    placeholder="Треків"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-amber-600 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Підзаголовок / Слоган у шапці
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleTextChange('tagline', e.target.value)}
                    placeholder="Кастомні деталі для дерев'яних залізниць"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Міні-бейдж біля логотипу
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => handleTextChange('badgeText', e.target.value)}
                    placeholder="3D Друк"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Верхній промо-рядок (Top Notification Bar)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Основний текст сповіщення
                    </label>
                    <input
                      type="text"
                      value={formData.topAnnouncement}
                      onChange={(e) => handleTextChange('topAnnouncement', e.target.value)}
                      placeholder="100% сумісність з рейками Brio, IKEA Lillabo, Hape"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Додатковий текст сповіщення
                    </label>
                    <input
                      type="text"
                      value={formData.topSecondaryText}
                      onChange={(e) => handleTextChange('topSecondaryText', e.target.value)}
                      placeholder="ECO PLA-пластик без запаху"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO BANNER */}
          {activeTab === 'hero' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Головний промо-банер магазину:</strong> Цей блок бачать покупці на головній сторінці сайту.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Верхній бейдж над заголовком
                </label>
                <input
                  type="text"
                  value={formData.heroBadge}
                  onChange={(e) => handleTextChange('heroBadge', e.target.value)}
                  placeholder="Кастомні 3D-деталі для дерев'яних залізниць"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Головний великий заголовок (H1)
                </label>
                <textarea
                  rows={2}
                  value={formData.heroTitle}
                  onChange={(e) => handleTextChange('heroTitle', e.target.value)}
                  placeholder="Кастомні 3D-друковані аксесуари та розширення для залізниць"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-serif font-bold text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Розгорнутий опис банера
                </label>
                <textarea
                  rows={3}
                  value={formData.heroDescription}
                  onChange={(e) => handleTextChange('heroDescription', e.target.value)}
                  placeholder="Опишіть переваги ваших треків та сумісність..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Текст головної кнопки переходу до каталогу
                </label>
                <input
                  type="text"
                  value={formData.heroPrimaryBtnText}
                  onChange={(e) => handleTextChange('heroPrimaryBtnText', e.target.value)}
                  placeholder="Переглянути каталог треків"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 3: TRUST BADGES */}
          {activeTab === 'badges' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>4 ключові переваги в банері:</strong> Налаштуйте текст та іконку для кожного з 4 блоків довіри.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.trustBadges.map((badge, idx) => (
                  <div key={badge.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Перевага #{idx + 1}</span>
                      <span className="text-[10px] text-slate-400 font-normal">Іконка</span>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={badge.text}
                        onChange={(e) => handleBadgeChange(idx, 'text', e.target.value)}
                        placeholder={`Текст переваги ${idx + 1}`}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                      />
                    </div>

                    <div>
                      {renderIconSelector(badge.iconType, (iconType) => handleBadgeChange(idx, 'iconType', iconType))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PAYMENT CARD REQUISITES */}
          {activeTab === 'payment' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Реквізити банківської картки:</strong> Цей номер картки та інструкція будуть автоматично показуватися покупцям у вікні оформлення замовлення, якщо вони оберуть спосіб <em>"Оплата на карту"</em>.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Номер картки (або IBAN рахунок) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cardNumber || ''}
                      onChange={(e) => handleTextChange('cardNumber', e.target.value)}
                      placeholder="4149 4999 8888 7777"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden tracking-wider"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Можна вводити з пробілами або без (наприклад: 4149 4999 8888 7777 або UA123456...)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Отримувач платежу (ПІБ або ФОП)
                  </label>
                  <input
                    type="text"
                    value={formData.cardHolder || ''}
                    onChange={(e) => handleTextChange('cardHolder', e.target.value)}
                    placeholder="Олександр Коваленко (або ФОП Коваленко О.В.)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Банк отримувача
                  </label>
                  <input
                    type="text"
                    value={formData.cardBank || ''}
                    onChange={(e) => handleTextChange('cardBank', e.target.value)}
                    placeholder="ПриватБанк / Monobank / Raiffeisen"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Інструкція для клієнта
                  </label>
                  <textarea
                    rows={3}
                    value={formData.cardPaymentInstructions || ''}
                    onChange={(e) => handleTextChange('cardPaymentInstructions', e.target.value)}
                    placeholder="Після перевірки деталей менеджер надішле вам точні реквізити в повідомленні..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden resize-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Цей текст покупець прочитає під час вибору оплати на карту і в квитанції замовлення.
                  </p>
                </div>
              </div>

              {/* Visual preview for owner */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-400">
                    <CreditCard className="w-3.5 h-3.5" />
                    Попередній перегляд картки для клієнта
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {formData.cardBank || 'Банк не вказано'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400">Номер картки для переказу:</div>
                    <div className="font-mono font-bold text-sm sm:text-base text-amber-400 tracking-wider">
                      {formData.cardNumber || 'Номер картки не вказано'}
                    </div>
                    {formData.cardHolder && (
                      <div className="text-xs text-slate-300 mt-0.5">
                        {formData.cardHolder}
                      </div>
                    )}
                  </div>
                </div>

                {formData.cardPaymentInstructions && (
                  <p className="text-[11px] text-slate-300 italic bg-white/5 p-2.5 rounded-lg border border-white/10">
                    "{formData.cardPaymentInstructions}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONTACTS & SOCIALS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Контакти та канали зв'язку:</strong> Відображаються у шапці, формі замовлення та футері сайту.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Основний телефон</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleTextChange('phone', e.target.value)}
                    placeholder="+38 (099) 123-45-67"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Додатковий телефон (опціонально)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phoneSecondary || ''}
                    onChange={(e) => handleTextChange('phoneSecondary', e.target.value)}
                    placeholder="+38 (067) 765-43-21"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span>Електронна пошта (Email)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleTextChange('email', e.target.value)}
                    placeholder="info@track-workshop.ua"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Графік роботи</span>
                  </label>
                  <input
                    type="text"
                    value={formData.workHours}
                    onChange={(e) => handleTextChange('workHours', e.target.value)}
                    placeholder="Пн-Сб: 09:00 - 20:00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Місто та інформація про доставку / самовивіз</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleTextChange('address', e.target.value)}
                  placeholder="Київ, Україна (Відправка Новою Поштою та Укрпоштою)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Месенджери та соціальні мережі
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Send className="w-3 h-3 text-sky-500" />
                      <span>Telegram</span>
                    </label>
                    <input
                      type="text"
                      value={formData.telegram || ''}
                      onChange={(e) => handleTextChange('telegram', e.target.value)}
                      placeholder="@track_workshop"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-purple-500" />
                      <span>Viber</span>
                    </label>
                    <input
                      type="text"
                      value={formData.viber || ''}
                      onChange={(e) => handleTextChange('viber', e.target.value)}
                      placeholder="+380991234567"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Instagram className="w-3 h-3 text-pink-500" />
                      <span>Instagram</span>
                    </label>
                    <input
                      type="text"
                      value={formData.instagram || ''}
                      onChange={(e) => handleTextChange('instagram', e.target.value)}
                      placeholder="@track.workshop"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FOOTER & COMPATIBILITY */}
          {activeTab === 'footer' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Підвал та список сумісних виробників:</strong> Додавайте чи видаляйте бренди дерев'яних колій, з якими сумісні ваші деталі.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Короткий опис майстерні у футері
                </label>
                <textarea
                  rows={2}
                  value={formData.footerDescription}
                  onChange={(e) => handleTextChange('footerDescription', e.target.value)}
                  placeholder="Кастомні 3D-друковані деталі, стрілки, розв'язки..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden resize-none"
                />
              </div>

              <div className="border-t border-slate-200 pt-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Список сумісних брендів (відображається у футері)
                </label>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={compatibilityInput}
                    onChange={(e) => setCompatibilityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCompatibilityItem();
                      }
                    }}
                    placeholder="наприклад: Playtive (Lidl), Thomas & Friends"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-amber-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddCompatibilityItem}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Додати</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.compatibilityList.map((item, idx) => (
                    <div 
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center gap-2"
                    >
                      <span>• {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompatibilityItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer / Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Скинути тексти до типових</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>Зберегти всі зміни</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
