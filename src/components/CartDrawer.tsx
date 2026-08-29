import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Truck, 
  Tag, 
  CheckCircle2 
} from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout?: () => void;
  onOpenCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onOpenCheckout
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscountRate, setPromoDiscountRate] = useState(0);
  const [promoError, setPromoError] = useState('');

  if (!isOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 2000;
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = promoApplied ? Math.round(subtotal * promoDiscountRate) : 0;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - (subtotal - discountAmount));
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 79;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'SHEETS10' || code === 'SALE10') {
      setPromoApplied(true);
      setPromoDiscountRate(0.10);
    } else if (code === 'TABLE15') {
      setPromoApplied(true);
      setPromoDiscountRate(0.15);
    } else {
      setPromoError('Недійсний промокод. Спробуйте SHEETS10');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Кошик замовлень</h2>
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {items.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress bar */}
          <div className="bg-emerald-50/70 p-3.5 border-b border-emerald-100">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-950 mb-1.5">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                {remainingForFreeShipping === 0 
                  ? 'Ура! Вам доступна безкоштовна доставка' 
                  : `Додайте товарів ще на ${remainingForFreeShipping.toLocaleString('uk-UA')} грн для безкоштовної доставки`}
              </span>
              <span>{Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))}%</span>
            </div>
            <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-base font-semibold text-slate-700">Ваш кошик порожній</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Оберіть необхідні товари в каталозі та додайте їх до кошика
                </p>
                <button
                  onClick={onClose}
                  className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Переглянути товари
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div key={product.id} className="py-4 flex gap-3.5 items-start">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                      {product.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {product.price.toLocaleString('uk-UA')} грн / шт.
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          className="w-6 h-6 rounded bg-white flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors text-xs font-bold shadow-2xs cursor-pointer"
                          title="Зменшити"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-slate-900 text-xs">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          disabled={quantity >= product.stock}
                          className="w-6 h-6 rounded bg-white flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors text-xs font-bold shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                          title="Збільшити"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-xs text-slate-900">
                          {(product.price * quantity).toLocaleString('uk-UA')} грн
                        </span>

                        <button
                          onClick={() => onRemoveItem(product.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Видалити"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Calculations & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
              
              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Промокод (SHEETS10)"
                      disabled={promoApplied}
                      className="w-full pl-8 pr-3 py-1.5 bg-white text-xs rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden font-mono uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={promoApplied || !promoCode.trim()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    {promoApplied ? 'Застосовано' : 'ОК'}
                  </button>
                </div>

                {promoApplied && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Знижка {promoDiscountRate * 100}% активована!
                  </p>
                )}
                {promoError && (
                  <p className="text-[11px] text-rose-500">{promoError}</p>
                )}
              </form>

              {/* Price rows */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                <div className="flex justify-between">
                  <span>Вартість товарів:</span>
                  <span className="font-semibold text-slate-800">{subtotal.toLocaleString('uk-UA')} грн</span>
                </div>

                {promoApplied && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Знижка за промокодом:</span>
                    <span>-{discountAmount.toLocaleString('uk-UA')} грн</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Доставка:</span>
                  <span className="font-semibold text-slate-800">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-600 font-bold">Безкоштовно</span>
                    ) : (
                      `${shippingCost} грн`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Разом до сплати:</span>
                  <span className="text-base text-emerald-700">{total.toLocaleString('uk-UA')} грн</span>
                </div>
              </div>

              {/* Checkout button */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenCheckout) {
                    onOpenCheckout();
                  } else if (onProceedToCheckout) {
                    onProceedToCheckout();
                  }
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
              >
                <span>Оформити замовлення</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
