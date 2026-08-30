import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Phone, 
  MapPin, 
  Truck, 
  CreditCard, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Trash2, 
  Download, 
  ExternalLink, 
  Bell, 
  Volume2, 
  Send, 
  FileText, 
  Check, 
  Printer, 
  PlusCircle, 
  MessageSquare,
  Sparkles,
  Settings,
  HelpCircle
} from 'lucide-react';
import { OrderDetails, NotificationSettings } from '../types';
import { 
  playOrderSound, 
  requestNotificationPermission, 
  sendTelegramNotification, 
  sendWebhookNotification,
  formatOrderTextForMessenger,
  getViberLinks 
} from '../utils/notificationService';

interface OrdersManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderDetails[];
  onUpdateOrderStatus: (orderId: string, status: OrderDetails['status']) => void;
  onUpdateOrderTracking: (orderId: string, trackingNumber: string) => void;
  onUpdateOrderNotes: (orderId: string, notes: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onClearAllOrders: () => void;
  onCreateTestOrder: () => void;
  notificationSettings: NotificationSettings;
  onSaveNotificationSettings: (settings: NotificationSettings) => void;
  storeBrandName: string;
}

export const OrdersManagerModal: React.FC<OrdersManagerModalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  onUpdateOrderTracking,
  onUpdateOrderNotes,
  onDeleteOrder,
  onClearAllOrders,
  onCreateTestOrder,
  notificationSettings,
  onSaveNotificationSettings,
  storeBrandName
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [tempTracking, setTempTracking] = useState('');
  
  // Confirmation dialogs
  const [orderToDelete, setOrderToDelete] = useState<OrderDetails | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  
  // Settings local state
  const [settingsForm, setSettingsForm] = useState<NotificationSettings>(notificationSettings);
  const [testTelegramStatus, setTestTelegramStatus] = useState<{ loading: boolean; message?: string; success?: boolean } | null>(null);
  const [testWebhookStatus, setTestWebhookStatus] = useState<{ loading: boolean; message?: string; success?: boolean } | null>(null);
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  if (!isOpen) return null;

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(it => it.product.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const newOrdersCount = orders.filter(o => o.status === 'new').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  const handleCopyOrderDetails = (order: OrderDetails) => {
    const text = formatOrderTextForMessenger(order, storeBrandName);
    navigator.clipboard.writeText(text);
    setCopiedOrderId(order.orderId);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNotificationSettings(settingsForm);
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 2500);
  };

  const handleTestTelegram = async () => {
    if (!settingsForm.telegramBotToken || !settingsForm.telegramChatId) {
      setTestTelegramStatus({
        loading: false,
        success: false,
        message: 'Будь ласка, вкажіть Bot Token та Chat ID'
      });
      return;
    }

    setTestTelegramStatus({ loading: true });
    const res = await sendTelegramNotification(
      settingsForm.telegramBotToken,
      settingsForm.telegramChatId,
      `🔔 <b>Тестове сповіщення від магазину ${storeBrandName}</b>\n\n✅ Інтеграція працює успішно! Ви будете миттєво отримувати сюди нові замовлення.`
    );

    setTestTelegramStatus({
      loading: false,
      success: res.success,
      message: res.success ? 'Тестове повідомлення успішно надіслано!' : (res.error || 'Помилка відправки')
    });
  };

  const handleTestWebhook = async () => {
    if (!settingsForm.webhookUrl) {
      setTestWebhookStatus({
        loading: false,
        success: false,
        message: 'Будь ласка, вкажіть Webhook URL'
      });
      return;
    }

    setTestWebhookStatus({ loading: true });
    const dummyOrder: OrderDetails = {
      orderId: 'TEST-9999',
      customerName: 'Тестовий Клієнт',
      phone: '+380991234567',
      city: 'Київ',
      deliveryType: 'nova_poshta',
      deliveryAddress: 'Відділення №1',
      paymentType: 'card_transfer',
      items: [],
      subtotal: 500,
      discount: 0,
      deliveryFee: 0,
      totalAmount: 500,
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    const res = await sendWebhookNotification(settingsForm.webhookUrl, dummyOrder);
    setTestWebhookStatus({
      loading: false,
      success: res.success,
      message: res.success ? 'Webhook успішно прийняв тестові дані!' : (res.error || 'Помилка')
    });
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    
    // Create CSV content with UTF-8 BOM for Ukrainian symbols in Excel
    const headers = ['Номер', 'Дата', 'Статус', 'Клієнт', 'Телефон', 'Місто', 'Доставка', 'Адреса', 'Оплата', 'Товари', 'Сума грн', 'ТТН'];
    const rows = orders.map(o => [
      o.orderId,
      new Date(o.createdAt).toLocaleString('uk-UA'),
      o.status,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.phone}"`,
      `"${o.city}"`,
      o.deliveryType,
      `"${o.deliveryAddress.replace(/"/g, '""')}"`,
      o.paymentType,
      `"${o.items.map(it => `${it.product.title} (${it.quantity} шт)`).join(', ')}"`,
      o.totalAmount,
      `"${o.trackingNumber || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `zamovlennya_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintOrder = (order: OrderDetails) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Товарний чек #${order.orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .meta { margin-bottom: 15px; font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f5f5f5; }
            .total { text-align: right; font-size: 16px; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${storeBrandName}</h2>
            <p>Товарний чек / Замовлення #${order.orderId} від ${new Date(order.createdAt).toLocaleString('uk-UA')}</p>
          </div>
          <div class="meta">
            <strong>Покупець:</strong> ${order.customerName}<br/>
            <strong>Телефон:</strong> ${order.phone}<br/>
            <strong>Місто:</strong> ${order.city}<br/>
            <strong>Доставка:</strong> ${order.deliveryType} (${order.deliveryAddress})<br/>
            <strong>Оплата:</strong> ${order.paymentType}<br/>
            ${order.trackingNumber ? `<strong>ТТН:</strong> ${order.trackingNumber}<br/>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Товар</th>
                <th>Ціна</th>
                <th>Кількість</th>
                <th>Сума</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((it, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${it.product.title}</td>
                  <td>${it.product.price} грн</td>
                  <td>${it.quantity} шт</td>
                  <td>${it.product.price * it.quantity} грн</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            Всього до сплати: ${order.totalAmount} грн
          </div>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div 
      id="orders-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Замовлення та Сповіщення
                </h2>
                {newOrdersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black animate-pulse">
                    {newOrdersCount} нових
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Керування замовленнями, зміна статусів, ТТН та налаштування сповіщень у Viber/Telegram
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'orders' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Замовлення ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'settings' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Сповіщення (Viber/TG)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'orders' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/60">
            
            {/* Top Metrics Cards & Actions */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-white shrink-0 space-y-4">
              
              {/* Quick stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                  <span className="text-[11px] text-amber-900/80 font-semibold block">Нові замовлення</span>
                  <span className="text-xl font-extrabold text-amber-900 font-serif">{newOrdersCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200/60">
                  <span className="text-[11px] text-blue-900/80 font-semibold block">В обробці</span>
                  <span className="text-xl font-extrabold text-blue-900 font-serif">{processingCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                  <span className="text-[11px] text-emerald-900/80 font-semibold block">Виконано</span>
                  <span className="text-xl font-extrabold text-emerald-900 font-serif">{completedCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200/60">
                  <span className="text-[11px] text-purple-900/80 font-semibold block">Загальна сума</span>
                  <span className="text-xl font-extrabold text-purple-900 font-serif">{totalRevenue.toLocaleString('uk-UA')} <span className="text-xs">грн</span></span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Пошук за номером, ім'ям, телефоном, містом чи товаром..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100/90 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-amber-500 outline-hidden"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={onCreateTestOrder}
                    className="px-3 py-2 rounded-xl bg-amber-100 text-amber-950 hover:bg-amber-200 font-bold text-xs flex items-center gap-1.5 border border-amber-300 transition-colors whitespace-nowrap cursor-pointer"
                    title="Створити швидке тестове замовлення для перевірки сповіщень"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>+ Тестове замовлення</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={orders.length === 0}
                    className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                    title="Завантажити таблицю замовлень у форматі Excel / CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Експорт в Excel (CSV)</span>
                  </button>
                  
                  {orders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowClearAllConfirm(true)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                      title="Очистити всі замовлення"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status pill filter */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: 'Всі', count: orders.length },
                  { id: 'new', label: '🔴 Нові', count: newOrdersCount },
                  { id: 'processing', label: '🟡 В обробці', count: processingCount },
                  { id: 'shipped', label: '🚚 Відправлено', count: orders.filter(o => o.status === 'shipped').length },
                  { id: 'completed', label: '🟢 Виконано', count: completedCount },
                  { id: 'cancelled', label: '⚪ Скасовано', count: orders.filter(o => o.status === 'cancelled').length }
                ].map(pill => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === pill.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {pill.label} ({pill.count})
                  </button>
                ))}
              </div>

            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">
                    {orders.length === 0 ? 'Замовлень ще немає' : 'Нічого не знайдено за фільтрами'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {orders.length === 0 
                      ? 'Коли клієнти оформлюватимуть замовлення на сайті, вони з\'являтимуться тут з усіма контактами, кошиком та сумою.'
                      : 'Спробуйте скинути пошуковий запит або змінити статус фільтра.'}
                  </p>
                  {orders.length === 0 && (
                    <button
                      type="button"
                      onClick={onCreateTestOrder}
                      className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Створити тестове замовлення</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const viberLinks = getViberLinks(order.phone, formatOrderTextForMessenger(order, storeBrandName));
                  const isCopied = copiedOrderId === order.orderId;

                  return (
                    <div 
                      key={order.orderId}
                      className={`bg-white rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs transition-all ${
                        order.status === 'new' 
                          ? 'border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/10' 
                          : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Order Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            #{order.orderId}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(order.createdAt).toLocaleString('uk-UA')}
                          </span>
                        </div>

                        {/* Status selector */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-600 hidden sm:inline">Статус:</label>
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateOrderStatus(order.orderId, e.target.value as OrderDetails['status'])}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border outline-hidden transition-all cursor-pointer ${
                              order.status === 'new' 
                                ? 'bg-rose-50 border-rose-300 text-rose-700' 
                                : order.status === 'processing' 
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : order.status === 'shipped'
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : order.status === 'completed'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-slate-100 border-slate-300 text-slate-600'
                            }`}
                          >
                            <option value="new">🔴 Нове</option>
                            <option value="processing">🟡 В обробці / Прийнято</option>
                            <option value="shipped">🚚 Відправлено (є ТТН)</option>
                            <option value="completed">🟢 Виконано / Оплачено</option>
                            <option value="cancelled">⚪ Скасовано</option>
                          </select>
                        </div>
                      </div>

                      {/* Main Order Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                        
                        {/* Customer & Delivery Column */}
                        <div className="space-y-2.5 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                          <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                            Дані покупця
                          </span>
                          
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 block">
                              {order.customerName}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <a 
                                href={`tel:${order.phone.replace(/[^0-9+]/g, '')}`}
                                className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{order.phone}</span>
                              </a>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 space-y-1">
                            <div className="flex items-start gap-1.5 text-slate-700">
                              <Truck className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <span>
                                <strong>
                                  {order.deliveryType === 'nova_poshta' ? 'Нова Пошта' : order.deliveryType === 'ukrposhta' ? 'Укрпошта' : 'Самовивіз'}:
                                </strong> {order.city}, {order.deliveryAddress}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-700">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                <strong>Оплата:</strong> {order.paymentType === 'cash_on_delivery' ? 'Післяплата (при отриманні)' : 'Оплата на карту'}
                              </span>
                            </div>

                            {order.comment && (
                              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-950 mt-1">
                                <span className="font-bold block text-[10px]">Коментар покупця:</span>
                                <span>"{order.comment}"</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Items Column */}
                        <div className="md:col-span-2 space-y-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                              Склад замовлення ({order.items.reduce((s, it) => s + it.quantity, 0)} шт.)
                            </span>
                            <span className="font-extrabold text-sm text-slate-900">
                              Сума: {order.totalAmount.toLocaleString('uk-UA')} грн
                            </span>
                          </div>

                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {order.items.map((item, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200/70 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img 
                                    src={item.product.imageUrl} 
                                    alt="" 
                                    className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-800 block truncate">
                                      {item.product.title}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      {item.product.price} грн × {item.quantity} шт.
                                    </span>
                                  </div>
                                </div>
                                <span className="font-extrabold text-slate-900 whitespace-nowrap">
                                  {(item.product.price * item.quantity).toLocaleString('uk-UA')} грн
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Tracking Number (ТТН) field */}
                          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                              <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">ТТН посилки:</span>
                              {editingTrackingId === order.orderId ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <input
                                    type="text"
                                    value={tempTracking}
                                    onChange={(e) => setTempTracking(e.target.value)}
                                    placeholder="20450912345678"
                                    className="px-2 py-1 bg-white border border-amber-400 rounded-lg text-xs flex-1 outline-hidden"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateOrderTracking(order.orderId, tempTracking);
                                      setEditingTrackingId(null);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Зберегти
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-xs bg-amber-100/80 text-amber-950 px-2 py-0.5 rounded-md">
                                    {order.trackingNumber || 'Не вказано'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTrackingId(order.orderId);
                                      setTempTracking(order.trackingNumber || '');
                                    }}
                                    className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                                  >
                                    {order.trackingNumber ? 'Змінити' : '+ Додати ТТН'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Action buttons toolbar for this order */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                        
                        {/* Messenger action buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          
                          {/* Direct Viber Chat button */}
                          <a
                            href={viberLinks.chatUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            title="Відкрити чат з клієнтом у Viber"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Чат у Viber</span>
                          </a>

                          {/* Call Customer */}
                          <a
                            href={`tel:${order.phone.replace(/[^0-9+]/g, '')}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-600" />
                            <span>Зателефонувати</span>
                          </a>

                          {/* Copy Order Text */}
                          <button
                            type="button"
                            onClick={() => handleCopyOrderDetails(order)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Скопіювати повний текст замовлення"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Скопійовано!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-600" />
                                <span>Копіювати деталі</span>
                              </>
                            )}
                          </button>

                          {/* Print Invoice */}
                          <button
                            type="button"
                            onClick={() => handlePrintOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Роздрукувати накладну"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>Друк чека</span>
                          </button>
                        </div>

                        {/* Delete single order */}
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(order)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Видалити це замовлення"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        ) : (
          /* Settings Tab */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
            <form onSubmit={handleSaveSettings} className="max-w-3xl mx-auto space-y-6">
              
              {savedSettingsSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Налаштування сповіщень успішно збережено!</span>
                </div>
              )}

              {/* 1. Viber Settings Card */}
              <div className="p-5 bg-white rounded-3xl border border-purple-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Сповіщення та зв'язок у Viber
                    </h3>
                    <p className="text-xs text-slate-500">
                      Швидкий зв'язок з клієнтами та відправка замовлень на ваш номер Viber
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Номер телефону власника (для Viber):
                    </label>
                    <input
                      type="text"
                      value={settingsForm.viberNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, viberNumber: e.target.value })}
                      placeholder="+380991234567"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold focus:bg-white focus:border-purple-500 outline-hidden"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      На цей номер формуються прямі посилання чатів та передаються дані замовлень.
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950 space-y-1.5">
                    <span className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                      Як працює Viber у системі:
                    </span>
                    <p className="text-[11px] text-purple-900 leading-relaxed">
                      У кожній картці замовлення є кнопка <strong>«Чат у Viber»</strong> та <strong>«Копіювати деталі»</strong>. Натиснувши на неї, ви одразу відкриваєте чат із клієнтом або відправляєте сформований чек.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Telegram Bot Instant Push Notifications Card */}
              <div className="p-5 bg-white rounded-3xl border border-blue-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        Автоматичні Push-сповіщення в Telegram (Рекомендовано)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Миттєве повідомлення вам у Telegram щойно покупець оформить замовлення
                      </p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.enableTelegram}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enableTelegram: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settingsForm.enableTelegram && (
                  <div className="space-y-3 pt-2 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Telegram Bot Token:
                      </label>
                      <input
                        type="text"
                        value={settingsForm.telegramBotToken || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, telegramBotToken: e.target.value })}
                        placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono focus:bg-white focus:border-blue-500 outline-hidden"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Отримайте безкоштовно у боті <strong>@BotFather</strong> за 30 секунд.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ваш Telegram Chat ID:
                      </label>
                      <input
                        type="text"
                        value={settingsForm.telegramChatId || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, telegramChatId: e.target.value })}
                        placeholder="123456789"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono focus:bg-white focus:border-blue-500 outline-hidden"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Дізнайтеся свій ID у боті <strong>@userinfobot</strong> або <strong>@myidbot</strong>.
                      </span>
                    </div>

                    {/* Test Telegram button */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        disabled={testTelegramStatus?.loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{testTelegramStatus?.loading ? 'Відправка...' : '🧪 Перевірити (надіслати тест)'}</span>
                      </button>

                      {testTelegramStatus?.message && (
                        <span className={`text-xs font-bold ${testTelegramStatus.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {testTelegramStatus.message}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Audio & Browser Notifications */}
              <div className="p-5 bg-white rounded-3xl border border-amber-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Звукові та браузерні сповіщення
                    </h3>
                    <p className="text-xs text-slate-500">
                      Миттєвий сигнал у вкладці при надходженні нового замовлення
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Звуковий сигнал (дзвіночок)</span>
                      <span className="text-[11px] text-slate-400">Програє мелодію при оформленні замовлення</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={playOrderSound}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer"
                      >
                        🔊 Тест звуку
                      </button>
                      <input
                        type="checkbox"
                        checked={settingsForm.soundAlerts}
                        onChange={(e) => setSettingsForm({ ...settingsForm, soundAlerts: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded-sm cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Браузерні Push-повідомлення</span>
                      <span className="text-[11px] text-slate-400">Показує віконце в кутку екрану</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await requestNotificationPermission();
                          if (ok) alert('Дозвіл на сповіщення надано успішно!');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                      >
                        Надати дозвіл
                      </button>
                      <input
                        type="checkbox"
                        checked={settingsForm.browserNotifications}
                        onChange={(e) => setSettingsForm({ ...settingsForm, browserNotifications: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded-sm cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Webhook / CRM Integration */}
              <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        Webhook / CRM / Google Таблиці (За бажанням)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Передавати JSON замовлення у KeyCRM, SalesDrive, Make або Zapier
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.enableWebhook}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enableWebhook: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                {settingsForm.enableWebhook && (
                  <div className="space-y-3 pt-2 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Webhook URL (POST):
                      </label>
                      <input
                        type="url"
                        value={settingsForm.webhookUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, webhookUrl: e.target.value })}
                        placeholder="https://hook.eu1.make.com/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:bg-white focus:border-slate-900 outline-hidden"
                      />
                    </div>

                    <div className="pt-1 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testWebhookStatus?.loading}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {testWebhookStatus?.loading ? 'Перевірка...' : '🧪 Тест Webhook'}
                      </button>
                      {testWebhookStatus?.message && (
                        <span className={`text-xs font-bold ${testWebhookStatus.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {testWebhookStatus.message}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Save button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Повернутися до замовлень
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Зберегти налаштування сповіщень</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* Confirmation Modal: Delete Single Order */}
      {orderToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Видалити замовлення #{orderToDelete.orderId}?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Клієнт: <strong>{orderToDelete.customerName}</strong> ({orderToDelete.totalAmount.toLocaleString('uk-UA')} грн). Замовлення буде безповоротно видалено з бази.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(orderToDelete.orderId);
                  setOrderToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
              >
                Так, видалити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All Orders */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Очистити всі замовлення?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Буде видалено всі <strong>{orders.length}</strong> замовлень з історії. Цю дію не можна буде скасувати.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllOrders();
                  setShowClearAllConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
              >
                Так, очистити все
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
