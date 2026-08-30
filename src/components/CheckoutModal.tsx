import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Truck, 
  CreditCard, 
  MapPin, 
  Phone, 
  User, 
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, OrderDetails, StoreInfo } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal?: number;
  discount?: number;
  storeInfo?: StoreInfo;
  onOrderPlaced?: (order: OrderDetails) => void;
  onSuccess?: (order: OrderDetails) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal: propSubtotal,
  discount: propDiscount = 0,
  storeInfo,
  onOrderPlaced,
  onSuccess
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [city, setCity] = useState('Київ');
  const [deliveryType, setDeliveryType] = useState<'nova_poshta' | 'ukrposhta' | 'pickup'>('nova_poshta');
  const [deliveryAddress, setDeliveryAddress] = useState('Відділення №1');
  const [paymentType, setPaymentType] = useState<'cash_on_delivery' | 'card_transfer'>('cash_on_delivery');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderDetails | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);

  const cardNumber = storeInfo?.cardNumber || '4149 4999 8888 7777';
  const cardHolder = storeInfo?.cardHolder || 'Олександр Коваленко';
  const cardBank = storeInfo?.cardBank || 'ПриватБанк / Monobank';
  const cardInstructions = storeInfo?.cardPaymentInstructions || 'Після оформлення замовлення ви можете здійснити оплату за вказаними реквізитами.';

  const handleCopyCard = () => {
    const rawNumber = cardNumber.replace(/\s+/g, '');
    navigator.clipboard.writeText(rawNumber).then(() => {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2500);
    }).catch(() => {
      // fallback
    });
  };

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCompletedOrder(null);
      setIsSubmitting(false);
      setCopiedCard(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const calculatedSubtotal = propSubtotal !== undefined
    ? propSubtotal
    : items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = propDiscount || 0;
  const subtotal = calculatedSubtotal;

  const deliveryFee = subtotal - discount >= 2000 ? 0 : 79;
  const totalAmount = Math.max(0, subtotal - discount + deliveryFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || phone.length < 10) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const order: OrderDetails = {
        orderId: `TM-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName,
        phone,
        city,
        deliveryType,
        deliveryAddress,
        paymentType,
        comment,
        items,
        subtotal,
        discount,
        deliveryFee,
        totalAmount,
        createdAt: new Date().toISOString(),
        status: 'new'
      };

      setCompletedOrder(order);
      if (onOrderPlaced) {
        onOrderPlaced(order);
      } else if (onSuccess) {
        onSuccess(order);
      }
      setIsSubmitting(false);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {completedOrder ? 'Замовлення успішно оформлено!' : 'Оформлення замовлення'}
              </h3>
              <p className="text-xs text-slate-500">
                {completedOrder ? `Номер замовлення: ${completedOrder.orderId}` : 'Заповніть контакти для швидкої доставки'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {completedOrder ? (
            /* Order Success View */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-900">
                  Дякуємо за покупку, {completedOrder.customerName}!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Ми надіслали деталі замовлення в SMS / повідомленні на номер <span className="font-semibold text-slate-800">{completedOrder.phone}</span>.
                </p>
              </div>

              {/* If Payment to Card was chosen, show prominent Card box */}
              {completedOrder.paymentType === 'card_transfer' && (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-700" />
                      <span>Реквізити для оплати на картку:</span>
                    </span>
                    <span className="text-xs font-extrabold text-amber-900">
                      {completedOrder.totalAmount.toLocaleString('uk-UA')} грн
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Номер картки ({cardBank}):</span>
                      <span className="font-mono font-bold text-sm sm:text-base text-slate-900 tracking-wider">
                        {cardNumber}
                      </span>
                      {cardHolder && (
                        <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                          Отримувач: {cardHolder}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCard}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        copiedCard 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                      }`}
                    >
                      {copiedCard ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Скопійовано!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Скопіювати</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-amber-800 leading-tight">
                    {cardInstructions}
                  </p>
                </div>
              )}

              {/* Order receipt box */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5">
                <div className="flex justify-between pb-2 border-b border-slate-200 font-semibold text-slate-700">
                  <span>Номер: #{completedOrder.orderId}</span>
                  <span>{new Date(completedOrder.createdAt).toLocaleString('uk-UA')}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Отримувач:</span>
                    <span className="font-medium text-slate-800">{completedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Доставка:</span>
                    <span className="font-medium text-slate-800">
                      {completedOrder.deliveryType === 'nova_poshta' ? 'Нова Пошта' : completedOrder.deliveryType === 'ukrposhta' ? 'Укрпошта' : 'Самовивіз'} ({completedOrder.city}, {completedOrder.deliveryAddress})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Оплата:</span>
                    <span className="font-medium text-slate-800">
                      {completedOrder.paymentType === 'cash_on_delivery' 
                        ? 'При отриманні (Накладений платіж)' 
                        : 'Оплата на карту (за реквізитами)'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800 mb-1">Товари ({completedOrder.items.length}):</div>
                  {completedOrder.items.map((i) => (
                    <div key={i.product.id} className="flex justify-between text-[11px] text-slate-600">
                      <span className="truncate max-w-[240px]">{i.product.title} × {i.quantity}</span>
                      <span className="font-bold">{(i.product.price * i.quantity).toLocaleString('uk-UA')} грн</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Сума до сплати:</span>
                  <span className="text-emerald-700">{completedOrder.totalAmount.toLocaleString('uk-UA')} грн</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Продовжити покупки в магазині
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Info */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  1. Контактні дані
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Прізвище та Ім'я *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Олександр Коваленко"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Номер телефону *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+380991234567"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  2. Доставка
                </h4>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('nova_poshta')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      deliveryType === 'nova_poshta'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    Нова Пошта
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('ukrposhta')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      deliveryType === 'ukrposhta'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    Укрпошта
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      deliveryType === 'pickup'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    Самовивіз
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Місто *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Київ"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {deliveryType === 'pickup' ? 'Точка видачі' : 'Номер відділення / Поштомат'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Відділення №1 (вул. Хрещатик, 1)"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  3. Спосіб оплати
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-medium transition-all ${
                    paymentType === 'cash_on_delivery' 
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-2xs ring-1 ring-emerald-600/30' 
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentType === 'cash_on_delivery'}
                      onChange={() => setPaymentType('cash_on_delivery')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold block">При отриманні</span>
                      <span className="text-[11px] text-slate-500">Накладений платіж у відділенні</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-medium transition-all ${
                    paymentType === 'card_transfer' 
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-2xs ring-1 ring-emerald-600/30' 
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentType === 'card_transfer'}
                      onChange={() => setPaymentType('card_transfer')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold block">Оплата на карту</span>
                      <span className="text-[11px] text-slate-500">За реквізитами картки / IBAN</span>
                    </div>
                  </label>
                </div>

                {/* Card preview if card_transfer is chosen */}
                {paymentType === 'card_transfer' && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 animate-in fade-in duration-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-amber-700" />
                        <span>Реквізити для оплати:</span>
                      </span>
                      {cardBank && (
                        <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-semibold">
                          {cardBank}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between gap-2 shadow-2xs">
                      <div>
                        <span className="font-mono font-bold text-sm text-slate-900 tracking-wider block">
                          {cardNumber}
                        </span>
                        {cardHolder && (
                          <span className="text-[11px] text-slate-600 font-medium block">
                            {cardHolder}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyCard}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                          copiedCard 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        {copiedCard ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Скопійовано!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Скопіювати</span>
                          </>
                        )}
                      </button>
                    </div>

                    {cardInstructions && (
                      <p className="text-[11px] text-amber-800/90 leading-tight">
                        {cardInstructions}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Коментар до замовлення (необов'язково)
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Бажаний час дзвінка або деталі доставки..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden font-medium"
                />
              </div>

              {/* Total calculation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Товари ({items.length} поз.):</span>
                  <span className="font-semibold text-slate-800">{subtotal.toLocaleString('uk-UA')} грн</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Знижка:</span>
                    <span>-{discount.toLocaleString('uk-UA')} грн</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Вартість доставки:</span>
                  <span className="font-semibold text-slate-800">
                    {deliveryFee === 0 ? 'Безкоштовно' : `${deliveryFee} грн`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>До сплати:</span>
                  <span className="text-base text-emerald-700">{totalAmount.toLocaleString('uk-UA')} грн</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
              >
                <span>{isSubmitting ? 'Оформлюємо...' : `Підтвердити замовлення (${totalAmount.toLocaleString('uk-UA')} грн)`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
