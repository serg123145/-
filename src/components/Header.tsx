import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Layers, 
  Plus, 
  LogOut, 
  User, 
  Sparkles, 
  Menu, 
  X, 
  Phone, 
  RefreshCw, 
  KeyRound,
  Package,
  Bell,
  Cloud
} from 'lucide-react';
import { AdminUser, StoreInfo } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
  isAdmin: boolean;
  adminUser: AdminUser | null;
  storeInfo: StoreInfo;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onOpenAddProductModal: () => void;
  onResetToDefaults: () => void;
  onOpenChangePinModal: () => void;
  onOpenStoreInfoModal: () => void;
  onOpenOrdersModal?: () => void;
  newOrdersCount?: number;
  totalOrdersCount?: number;
  totalProductsCount: number;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  isAdmin,
  adminUser,
  storeInfo,
  onOpenLoginModal,
  onLogout,
  onOpenAddProductModal,
  onResetToDefaults,
  onOpenChangePinModal,
  onOpenStoreInfoModal,
  onOpenOrdersModal,
  newOrdersCount = 0,
  totalOrdersCount = 0,
  totalProductsCount,
  isCloudConnected = true
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      
      {/* Top Notification Bar */}
      <div className="bg-slate-900 text-white py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {isAdmin ? (
            /* ADMIN STATUS BAR */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Кабінет власника
                </span>
                {isCloudConnected && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30" title="Хмарна база даних Firebase Firestore активна">
                    <Cloud className="w-3 h-3 text-emerald-400" />
                    <span>Хмара онлайн</span>
                  </span>
                )}
                {newOrdersCount > 0 && (
                  <button
                    type="button"
                    onClick={onOpenOrdersModal}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] transition-colors cursor-pointer animate-pulse"
                  >
                    <Bell className="w-3 h-3" />
                    <span>{newOrdersCount} нових замовлень!</span>
                  </button>
                )}
                <span className="text-slate-300 text-[11px] hidden sm:inline">
                  У каталозі: <strong className="text-white">{totalProductsCount}</strong> деталей
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Orders Button */}
                <button
                  type="button"
                  onClick={onOpenOrdersModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] transition-colors cursor-pointer border border-slate-700"
                  title="Переглянути замовлення та налаштувати сповіщення"
                >
                  <Package className="w-3 h-3 text-amber-400" />
                  <span>Замовлення {totalOrdersCount > 0 ? `(${totalOrdersCount})` : ''}</span>
                  {newOrdersCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onOpenAddProductModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Товар</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenStoreInfoModal}
                  className="text-amber-300 hover:text-amber-200 text-[11px] hidden md:flex items-center gap-1 transition-colors cursor-pointer bg-white/10 px-2 py-0.5 rounded-md"
                  title="Редагувати назву, опис, контакти та банер"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Інфо</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenChangePinModal}
                  className="text-slate-300 hover:text-amber-400 text-[11px] hidden sm:flex items-center gap-1 transition-colors cursor-pointer"
                  title="Змінити PIN-код доступу"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>PIN</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Вийти</span>
                </button>
              </div>
            </div>
          ) : (
            /* BUYER TOP PROMO BAR */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-4 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{storeInfo.topAnnouncement}</span>
                </span>
                {storeInfo.topSecondaryText && (
                  <>
                    <span className="text-slate-600 hidden md:inline">•</span>
                    <span className="text-slate-300 hidden md:inline">
                      {storeInfo.topSecondaryText}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                {storeInfo.phone && (
                  <a href={`tel:${storeInfo.phone.replace(/[^0-9+]/g, '')}`} className="text-slate-300 hover:text-amber-400 transition-colors hidden sm:flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{storeInfo.phone}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium cursor-pointer"
                >
                  <User className="w-3 h-3" />
                  <span>Вхід для власника</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight font-serif">
                  {storeInfo.brandName}<span className="text-amber-600">{storeInfo.brandAccent}</span>
                </span>
                {isAdmin ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                    Власник
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {storeInfo.badgeText}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {storeInfo.tagline}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Пошук стрілок, депо, мостів, перехідників..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm text-slate-900 outline-hidden transition-all placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            
            {/* Owner quick create product button */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={onOpenOrdersModal}
                  className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all active:scale-95 cursor-pointer relative"
                >
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Замовлення</span>
                  {newOrdersCount > 0 && (
                    <span className="min-w-5 h-5 px-1 bg-rose-500 text-white rounded-full text-[11px] font-black flex items-center justify-center animate-pulse">
                      {newOrdersCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onOpenAddProductModal}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Додати товар</span>
                </button>
              </>
            )}

            {/* Cart Button */}
            <button
              id="header-cart-button"
              type="button"
              onClick={onOpenCart}
              className="relative px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-slate-900/10 active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Кошик</span>
              {cartCount > 0 && (
                <span className="min-w-5 h-5 px-1 bg-amber-500 text-slate-950 rounded-full text-xs font-black flex items-center justify-center animate-in zoom-in-50">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Search Input */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Пошук деталей залізниці..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Category Navigation Pills (Desktop & Tablet) */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Всі товари ({totalProductsCount})
          </button>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === category
                  ? 'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/20 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

      </div>

      {/* Mobile Drawer / Quick Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          {isAdmin ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenOrdersModal) onOpenOrdersModal();
                }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm relative"
              >
                <Package className="w-4 h-4 text-amber-400" />
                <span>Замовлення ({totalOrdersCount})</span>
                {newOrdersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                    {newOrdersCount} нових
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAddProductModal();
                }}
                className="w-full py-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Додати нову 3D-деталь</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStoreInfoModal();
                }}
                className="w-full py-2 bg-amber-50 text-amber-950 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-amber-300 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Редагувати блоки інформації</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenChangePinModal();
                }}
                className="w-full py-2 text-slate-700 hover:text-slate-900 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Змінити PIN-код доступу</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (confirm('Скинути всі товари до стандартного початкового каталогу?')) {
                    onResetToDefaults();
                  }
                }}
                className="w-full py-2 text-slate-600 hover:text-slate-900 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Скинути каталог до початкового</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2 text-rose-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Вийти з кабінету
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLoginModal();
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Вхід для власника магазину</span>
              </button>
            </div>
          )}
        </div>
      )}

    </header>
  );
};
