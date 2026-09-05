import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  TrendingDown, 
  Layers, 
  RefreshCw, 
  SlidersHorizontal,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  Settings,
  Heart,
  Clock,
  Send,
  MessageSquare,
  Instagram,
  Edit3
} from 'lucide-react';

import { Product, CartItem, SortOption, OrderDetails, AdminUser, StoreInfo, TrustBadgeItem, NotificationSettings } from './types';
import { DEFAULT_PRODUCTS } from './data/defaultCatalog';
import { DEFAULT_STORE_INFO } from './data/defaultStoreInfo';
import { DEFAULT_NOTIFICATION_SETTINGS, dispatchNewOrderNotifications } from './utils/notificationService';
import { safeLocalStorageSet, safeLocalStorageGet, safeLocalStorageRemove } from './utils/storage';
import { 
  subscribeToProducts, 
  subscribeToOrders, 
  subscribeToStoreInfo, 
  subscribeToNotificationSettings,
  subscribeToAdminPin,
  saveAdminPinToFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  updateOrderTrackingInFirestore,
  updateOrderNotesInFirestore,
  deleteOrderFromFirestore,
  clearAllOrdersInFirestore,
  saveStoreInfoToFirestore,
  saveNotificationSettingsToFirestore,
  seedProductsIfEmpty,
  seedStoreInfoIfEmpty,
  resetCatalogInFirestore
} from './services/firestoreService';
import { isFirebaseConfigured } from './services/firebase';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { ProductFormModal } from './components/ProductFormModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ChangePinModal } from './components/ChangePinModal';
import { StoreInfoModal } from './components/StoreInfoModal';
import { OrdersManagerModal } from './components/OrdersManagerModal';
import { CatalogControls } from './components/CatalogControls';
import { NotificationToast } from './components/NotificationToast';
import { groupSimilarProductsAdjacent, findSimilarProducts } from './utils/similarity';

const INITIAL_DEMO_ORDERS: OrderDetails[] = [
  {
    orderId: 'TM-734192',
    customerName: 'Максим Петренко',
    phone: '+380671234567',
    city: 'Київ',
    deliveryType: 'nova_poshta',
    deliveryAddress: 'Відділення №45 (вул. Хрещатик, 22)',
    paymentType: 'card_online',
    comment: 'Будь ласка, запакуйте надійно, це подарунок дитині!',
    items: [
      { product: DEFAULT_PRODUCTS[0], quantity: 2 },
      { product: DEFAULT_PRODUCTS[1], quantity: 1 }
    ],
    subtotal: 510,
    discount: 0,
    deliveryFee: 0,
    totalAmount: 510,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'new'
  },
  {
    orderId: 'TM-592810',
    customerName: 'Олена Сидоренко',
    phone: '+380509876543',
    city: 'Львів',
    deliveryType: 'nova_poshta',
    deliveryAddress: 'Поштомат №3819 (вул. Стрийська)',
    paymentType: 'cash_on_delivery',
    comment: 'Передзвоніть перед відправкою',
    items: [
      { product: DEFAULT_PRODUCTS[2], quantity: 1 },
      { product: DEFAULT_PRODUCTS[3], quantity: 2 }
    ],
    subtotal: 780,
    discount: 0,
    deliveryFee: 0,
    totalAmount: 780,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'processing',
    trackingNumber: '20450918273645'
  }
];

export default function App() {
  // Store info state (Name, Description, Contacts, Badges, etc.)
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() => {
    const saved = safeLocalStorageGet<Partial<StoreInfo> | null>('trk_store_info', null);
    if (saved && typeof saved === 'object') {
      return { ...DEFAULT_STORE_INFO, ...saved };
    }
    return DEFAULT_STORE_INFO;
  });

  // Firestore Cloud connection state
  const [isCloudConnected, setIsCloudConnected] = useState(isFirebaseConfigured);

  // Initialize and synchronize with Firebase Firestore in real-time
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let isMounted = true;

    // Seed database with default data if fresh
    seedProductsIfEmpty(DEFAULT_PRODUCTS).catch(console.error);
    seedStoreInfoIfEmpty(DEFAULT_STORE_INFO).catch(console.error);

    // 1. Live Products listener
    const unsubProducts = subscribeToProducts(
      (liveProducts) => {
        if (isMounted && liveProducts.length > 0) {
          setProducts(liveProducts);
          safeLocalStorageSet('trk_products_catalog', liveProducts);
          setIsCloudConnected(true);
        }
      },
      () => setIsCloudConnected(false)
    );

    // 2. Live Orders listener
    const unsubOrders = subscribeToOrders(
      (liveOrders) => {
        if (isMounted && liveOrders) {
          setOrders(liveOrders);
          safeLocalStorageSet('trk_orders_history', liveOrders);
        }
      },
      () => setIsCloudConnected(false)
    );

    // 3. Live Store Info listener
    const unsubStoreInfo = subscribeToStoreInfo(
      (liveInfo) => {
        if (isMounted && liveInfo && liveInfo.brandName) {
          setStoreInfo(liveInfo);
          safeLocalStorageSet('trk_store_info', liveInfo);
        }
      },
      () => setIsCloudConnected(false)
    );

    // 4. Live Notification Settings listener
    const unsubSettings = subscribeToNotificationSettings(
      (liveSettings) => {
        if (isMounted && liveSettings) {
          setNotificationSettings(liveSettings);
          safeLocalStorageSet('trk_notification_settings', liveSettings);
        }
      },
      () => setIsCloudConnected(false)
    );

    // 5. Live Admin PIN listener
    const unsubPin = subscribeToAdminPin(
      (livePin) => {
        if (isMounted && livePin && livePin.length >= 4) {
          setAdminPin(livePin);
          safeLocalStorageSet('trk_admin_pin', livePin);
        }
      },
      () => setIsCloudConnected(false)
    );

    return () => {
      isMounted = false;
      unsubProducts();
      unsubOrders();
      unsubStoreInfo();
      unsubSettings();
      unsubPin();
    };
  }, []);

  // Save store info when updated
  useEffect(() => {
    safeLocalStorageSet('trk_store_info', storeInfo);
  }, [storeInfo]);

  // Admin PIN state (persisted locally and synced with Cloud Firestore)
  const [adminPin, setAdminPin] = useState<string>(() => {
    return safeLocalStorageGet<string>('trk_admin_pin', '7777');
  });

  const handleSaveAdminPin = async (newPin: string) => {
    const cleanPin = newPin.trim();
    setAdminPin(cleanPin);
    safeLocalStorageSet('trk_admin_pin', cleanPin);
    try {
      await saveAdminPinToFirestore(cleanPin);
    } catch (e) {
      console.error('Failed to sync PIN to Firestore:', e);
    }
  };

  // Products state with local storage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = safeLocalStorageGet<Product[] | null>('trk_products_catalog', null);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return DEFAULT_PRODUCTS;
  });

  // Save products whenever updated
  useEffect(() => {
    safeLocalStorageSet('trk_products_catalog', products);
  }, [products]);

  // Shopping Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    return safeLocalStorageGet<CartItem[]>('trk_cart_items', []);
  });

  useEffect(() => {
    safeLocalStorageSet('trk_cart_items', cart);
  }, [cart]);

  // Admin User Auth state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    return safeLocalStorageGet<AdminUser | null>('trk_admin_session', null);
  });

  const isAdmin = !!adminUser;

  const handleAdminLogin = (user: AdminUser) => {
    setAdminUser(user);
    safeLocalStorageSet('trk_admin_session', user);
    showToast(`Вітаємо, ${user.name}! Режим власника активовано.`, 'success');
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    safeLocalStorageRemove('trk_admin_session');
    showToast('Ви вийшли з режиму власника', 'info');
  };

  // UI Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isStoreInfoModalOpen, setIsStoreInfoModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Orders & Notifications state
  const [orders, setOrders] = useState<OrderDetails[]>(() => {
    const saved = safeLocalStorageGet<OrderDetails[] | null>('trk_orders_history', null);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return INITIAL_DEMO_ORDERS;
  });

  useEffect(() => {
    safeLocalStorageSet('trk_orders_history', orders);
  }, [orders]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = safeLocalStorageGet<Partial<NotificationSettings> | null>('trk_notification_settings', null);
    if (saved && typeof saved === 'object') {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...saved };
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  });

  useEffect(() => {
    safeLocalStorageSet('trk_notification_settings', notificationSettings);
  }, [notificationSettings]);

  // Order count metrics
  const newOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'new' || !o.status).length;
  }, [orders]);

  // Order Handlers
  const handleUpdateOrderStatus = (orderId: string, status: OrderDetails['status']) => {
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status } : o));
    updateOrderStatusInFirestore(orderId, status).catch(console.error);
    showToast(`Статус замовлення #${orderId} змінено на "${status}"`, 'info');
  };

  const handleUpdateOrderTracking = (orderId: string, trackingNumber: string) => {
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, trackingNumber } : o));
    updateOrderTrackingInFirestore(orderId, trackingNumber).catch(console.error);
    showToast(`ТТН для замовлення #${orderId} збережено!`, 'success');
  };

  const handleUpdateOrderNotes = (orderId: string, internalNotes: string) => {
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, internalNotes } : o));
    updateOrderNotesInFirestore(orderId, internalNotes).catch(console.error);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.orderId !== orderId));
    deleteOrderFromFirestore(orderId).catch(console.error);
    showToast(`Замовлення #${orderId} видалено`, 'warning');
  };

  const handleClearAllOrders = () => {
    setOrders([]);
    localStorage.removeItem('trk_orders_history');
    clearAllOrdersInFirestore().catch(console.error);
    showToast('Історію замовлень очищено', 'info');
  };

  const handleSaveNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    localStorage.setItem('trk_notification_settings', JSON.stringify(newSettings));
    saveNotificationSettingsToFirestore(newSettings).catch(console.error);
    showToast('Налаштування сповіщень (Telegram / Viber / Webhook) збережено!', 'success');
  };

  const handleCreateTestOrder = () => {
    const randomProduct1 = products[0] || DEFAULT_PRODUCTS[0];
    const randomProduct2 = products[1] || DEFAULT_PRODUCTS[1];
    const testOrder: OrderDetails = {
      orderId: `TM-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: 'Тестовий Покупець',
      phone: '+380671112233',
      city: 'Київ',
      deliveryType: 'nova_poshta',
      deliveryAddress: 'Відділення №1 (вул. Пирогівський шлях, 135)',
      paymentType: 'cash_on_delivery',
      comment: 'Тестове замовлення для перевірки сповіщень та обробки',
      items: [
        { product: randomProduct1, quantity: 1 },
        { product: randomProduct2, quantity: 2 }
      ],
      subtotal: randomProduct1.price + randomProduct2.price * 2,
      discount: 0,
      deliveryFee: 0,
      totalAmount: randomProduct1.price + randomProduct2.price * 2,
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    setOrders(prev => [testOrder, ...prev]);
    saveOrderToFirestore(testOrder).catch(console.error);
    dispatchNewOrderNotifications(testOrder, notificationSettings, storeInfo.brandName);
    showToast(`Створено тестове замовлення #${testOrder.orderId} та надіслано сповіщення!`, 'success');
  };
  
  // Product Form (Create / Edit) state
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Store Info Handlers
  const handleSaveStoreInfo = (newInfo: StoreInfo) => {
    setStoreInfo(newInfo);
    safeLocalStorageSet('trk_store_info', newInfo);
    saveStoreInfoToFirestore(newInfo).catch(console.error);
    showToast('Інформаційні блоки магазину успішно оновлено!', 'success');
  };

  const handleResetStoreInfo = () => {
    setStoreInfo(DEFAULT_STORE_INFO);
    safeLocalStorageRemove('trk_store_info');
    saveStoreInfoToFirestore(DEFAULT_STORE_INFO).catch(console.error);
    showToast('Інформаційні блоки повернуто до стандартних', 'info');
  };

  const renderTrustBadgeIcon = (iconType: TrustBadgeItem['iconType']) => {
    switch (iconType) {
      case 'shield':
        return <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'truck':
        return <Truck className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'zap':
        return <Zap className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'heart':
        return <Heart className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'check':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'sparkles':
      default:
        return <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />;
    }
  };

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning'; id: number } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [groupBySimilar, setGroupBySimilar] = useState(true);

  // Extract unique categories from actual products
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return cats.sort();
  }, [products]);

  // Pre-calculate similar products map for each product across catalog
  const similarProductsMap = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const similars = findSimilarProducts(p, products, 8).map(s => s.product);
      map.set(p.id, similars);
    }
    return map;
  }, [products]);

  // Filtered and Sorted Products (with adjacent grouping for very similar items)
  const filteredProducts = useMemo(() => {
    const rawFiltered = products.filter((p) => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(term);
        const matchesSku = p.sku?.toLowerCase().includes(term);
        const matchesCategory = p.category.toLowerCase().includes(term);
        const matchesDesc = p.description?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesSku && !matchesCategory && !matchesDesc) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // In-stock filter
      if (onlyInStock && p.stock <= 0) {
        return false;
      }

      // Discounted filter
      if (onlyDiscounted && (!p.oldPrice || p.oldPrice <= p.price)) {
        return false;
      }

      return true;
    });

    const getComparator = (option: SortOption): ((a: Product, b: Product) => number) => {
      switch (option) {
        case 'price-asc':
          return (a, b) => a.price - b.price;
        case 'price-desc':
          return (a, b) => b.price - a.price;
        case 'rating':
          return (a, b) => (b.rating || 0) - (a.rating || 0);
        case 'name-asc':
          return (a, b) => a.title.localeCompare(b.title, 'uk');
        case 'similar':
          return (a, b) => a.title.localeCompare(b.title, 'uk');
        case 'popular':
        default:
          return (a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0);
      }
    };

    const comparator = getComparator(sortOption);

    // Group similar items adjacent if groupBySimilar is ON or sortOption is 'similar' or 'popular'
    if (groupBySimilar || sortOption === 'similar') {
      return groupSimilarProductsAdjacent(rawFiltered, comparator);
    }

    return [...rawFiltered].sort(comparator);
  }, [products, searchTerm, selectedCategory, sortOption, onlyInStock, onlyDiscounted, groupBySimilar]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    showToast(`"${product.title}" додано у кошик!`, 'success');
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: Math.min(newQty, item.product.stock) } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleSetCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      const product = products.find(p => p.id === productId);
      const maxStock = product ? product.stock : 999;
      if (quantity <= 0) {
        return prev.filter(item => item.product.id !== productId);
      }
      const existing = prev.find(item => item.product.id === productId);
      if (existing) {
        return prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: Math.min(quantity, maxStock) }
            : item
        );
      } else if (product) {
        return [...prev, { product, quantity: Math.min(quantity, maxStock) }];
      }
      return prev;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckoutSuccess = async (order: OrderDetails) => {
    const formattedOrder: OrderDetails = {
      ...order,
      status: 'new',
      createdAt: order.createdAt || new Date().toISOString()
    };

    // Save to orders state & Firestore
    setOrders(prev => [formattedOrder, ...prev]);
    saveOrderToFirestore(formattedOrder).catch(console.error);

    // Decrease stock locally & in Firestore
    setProducts(prev => {
      return prev.map(p => {
        const orderedItem = order.items.find(item => item.product.id === p.id);
        if (orderedItem) {
          const newStock = Math.max(0, p.stock - orderedItem.quantity);
          const updatedProd = { ...p, stock: newStock, inStock: newStock > 0 };
          saveProductToFirestore(updatedProd).catch(console.error);
          return updatedProd;
        }
        return p;
      });
    });

    handleClearCart();
    
    // Dispatch real-time multi-channel notification (Telegram, Webhook, Sound, Browser, etc.)
    await dispatchNewOrderNotifications(formattedOrder, notificationSettings, storeInfo.brandName);

    showToast(`Замовлення #${order.orderId} оформлено! Сповіщення надіслано власнику.`, 'success');
  };

  // Product Management (Add, Edit, Duplicate, Delete)
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleSaveProduct = (productData: Product) => {
    setProducts(prev => {
      const existsIndex = prev.findIndex(p => p.id === productData.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = productData;
        return updated;
      }
      return [productData, ...prev];
    });

    saveProductToFirestore(productData).catch(console.error);

    showToast(
      editingProduct 
        ? `Картку "${productData.title}" успішно оновлено!` 
        : `Новий товар "${productData.title}" створено!`,
      'success'
    );
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicated: Product = {
      ...product,
      id: `TRK-${Date.now().toString().slice(-4)}`,
      sku: `${product.sku || 'TRK'}-COPY`,
      title: `${product.title} (Копія)`,
      reviewsCount: 0
    };
    setProducts(prev => [duplicated, ...prev]);
    saveProductToFirestore(duplicated).catch(console.error);
    showToast(`Створено копію товару "${product.title}"`, 'info');
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    deleteProductFromFirestore(productId).catch(console.error);
    showToast('Товар видалено з каталогу', 'warning');
  };

  const handleResetCatalog = () => {
    setProducts(DEFAULT_PRODUCTS);
    localStorage.removeItem('trk_products_catalog');
    resetCatalogInFirestore(DEFAULT_PRODUCTS).catch(console.error);
    showToast('Каталог скинуто до початкового асортименту', 'info');
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900 selection:bg-amber-200">
      
      {/* Toast Notification */}
      {toast && (
        <NotificationToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Bar */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categories}
        isAdmin={isAdmin}
        adminUser={adminUser}
        storeInfo={storeInfo}
        onOpenLoginModal={() => setIsAdminLoginOpen(true)}
        onLogout={handleAdminLogout}
        onOpenAddProductModal={handleOpenAddProduct}
        onResetToDefaults={handleResetCatalog}
        onOpenChangePinModal={() => setIsChangePinOpen(true)}
        onOpenStoreInfoModal={() => setIsStoreInfoModalOpen(true)}
        onOpenOrdersModal={() => setIsOrdersModalOpen(true)}
        newOrdersCount={newOrdersCount}
        totalOrdersCount={orders.length}
        totalProductsCount={products.length}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Hero Banner (Adaptive for Admin vs Customer) */}
        {isAdmin ? (
          /* OWNER BANNER */
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 mb-8 shadow-xl border border-slate-800">
            <div className="relative z-10 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Кабінет власника: {adminUser?.name || 'Адміністратор'}</span>
                </div>
                {newOrdersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsOrdersModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all animate-pulse cursor-pointer"
                  >
                    <span>🔔 {newOrdersCount} нових замовлень!</span>
                  </button>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-serif">
                Керування магазином <span className="text-amber-400">{storeInfo.brandName} {storeInfo.brandAccent}</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                Створюйте нові картки товарів, завантажуйте реальні фотографії, керуйте замовленнями клієнтів та налаштовуйте миттєві сповіщення через <strong>Telegram</strong>, <strong>Viber</strong> або Webhook.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOrdersModalOpen(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2 active:scale-95 cursor-pointer relative"
                >
                  <Send className="w-4 h-4" />
                  <span>📦 Замовлення та Сповіщення</span>
                  {newOrdersCount > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>+ Створити картку товару</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStoreInfoModalOpen(true)}
                  className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 border border-amber-500/30 cursor-pointer"
                  title="Редагувати назву, опис, банер, контакти та футер"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Редагувати інфо-блоки</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(true)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 border border-white/10 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Змінити PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Скинути весь каталог до стандартного набору деталей?')) {
                      handleResetCatalog();
                    }
                  }}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 border border-white/10 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Скинути каталог</span>
                </button>
              </div>
            </div>

            {/* Quick Admin Stats */}
            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div 
                onClick={() => setIsOrdersModalOpen(true)} 
                className="text-slate-300 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50 cursor-pointer hover:bg-slate-800/70 transition-colors"
              >
                <span className="text-slate-400 flex items-center justify-between text-[11px]">
                  <span>Замовлень</span>
                  {newOrdersCount > 0 && <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full font-bold">{newOrdersCount} нових</span>}
                </span>
                <strong className="text-lg font-bold text-amber-400">{orders.length} шт.</strong>
              </div>
              <div className="text-slate-300 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block text-[11px]">Всього позицій</span>
                <strong className="text-lg font-bold text-white">{products.length} шт.</strong>
              </div>
              <div className="text-slate-300 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block text-[11px]">В наявності</span>
                <strong className="text-lg font-bold text-emerald-400">
                  {products.filter(p => p.stock > 0).length}
                </strong>
              </div>
              <div className="text-slate-300 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block text-[11px]">Категорій</span>
                <strong className="text-lg font-bold text-amber-300">{categories.length}</strong>
              </div>
            </div>
          </section>
        ) : (
          /* BUYER HERO BANNER */
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-10 mb-8 shadow-xl border border-slate-800">
            <div className="relative z-10 max-w-2xl">
              {storeInfo.heroBadge && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{storeInfo.heroBadge}</span>
                </div>
              )}

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-serif">
                {storeInfo.heroTitle}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                {storeInfo.heroDescription}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#catalog-view"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 active:scale-95"
                >
                  <span>{storeInfo.heroPrimaryBtnText || 'Переглянути каталог треків'}</span>
                  <ChevronRight className="w-4 h-4" />
                </a>

                <button
                  onClick={() => {
                    setOnlyDiscounted(prev => !prev);
                  }}
                  className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 border cursor-pointer ${
                    onlyDiscounted 
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' 
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  <span>Акційні набори</span>
                </button>
              </div>
            </div>

            {/* Buyer Trust Badges */}
            {storeInfo.trustBadges && storeInfo.trustBadges.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {storeInfo.trustBadges.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-2 text-slate-300">
                    {renderTrustBadgeIcon(badge.iconType)}
                    <span>{badge.title}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Catalog Section Controls & Filter */}
        <section id="catalog-view" className="space-y-6">
          <CatalogControls
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onlyInStock={onlyInStock}
            onToggleInStock={() => setOnlyInStock(!onlyInStock)}
            onlyDiscounted={onlyDiscounted}
            onToggleDiscounted={() => setOnlyDiscounted(!onlyDiscounted)}
            groupBySimilar={groupBySimilar}
            onToggleGroupBySimilar={() => setGroupBySimilar(!groupBySimilar)}
            totalCount={filteredProducts.length}
          />

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredProducts.map((product) => {
                const inCartItem = cart.find(item => item.product.id === product.id);
                const currentQty = inCartItem ? inCartItem.quantity : 0;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cartQuantity={currentQty}
                    similarCount={similarProductsMap.get(product.id)?.length || 0}
                    onAddToCart={handleAddToCart}
                    onUpdateCartQuantity={handleUpdateCartQuantity}
                    onOpenDetails={setSelectedProduct}
                    onEditProduct={isAdmin ? handleOpenEditProduct : undefined}
                    onDuplicateProduct={isAdmin ? handleDuplicateProduct : undefined}
                    onDeleteProduct={isAdmin ? handleDeleteProduct : undefined}
                    isInCart={currentQty > 0}
                    isAdmin={isAdmin}
                  />
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                За вашим запитом нічого не знайдено
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Спробуйте змінити пошукове слово або скинути фільтри.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setOnlyInStock(false);
                    setOnlyDiscounted(false);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Скинути всі фільтри
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Додати новий товар</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-16 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-bold text-base font-serif">
                  {storeInfo.brandName}<span className="text-amber-400">{storeInfo.brandAccent}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {storeInfo.footerDescription}
              </p>
              
              {/* Social links */}
              {(storeInfo.telegram || storeInfo.viber || storeInfo.instagram) && (
                <div className="flex items-center gap-2 mt-4">
                  {storeInfo.telegram && (
                    <a
                      href={storeInfo.telegram.startsWith('http') ? storeInfo.telegram : `https://t.me/${storeInfo.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Telegram</span>
                    </a>
                  )}
                  {storeInfo.viber && (
                    <a
                      href={`viber://chat?number=${storeInfo.viber.replace(/[^0-9+]/g, '')}`}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Viber</span>
                    </a>
                  )}
                  {storeInfo.instagram && (
                    <a
                      href={storeInfo.instagram.startsWith('http') ? storeInfo.instagram : `https://instagram.com/${storeInfo.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Instagram className="w-3 h-3" />
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Compatibility info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                Сумісність
              </h4>
              <ul className="text-xs text-slate-400 space-y-1.5">
                {storeInfo.compatibilityList && storeInfo.compatibilityList.length > 0 ? (
                  storeInfo.compatibilityList.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))
                ) : (
                  <li>• Brio, IKEA Lillabo, Hape</li>
                )}
              </ul>
            </div>

            {/* Contacts */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                Контакти
              </h4>
              <ul className="text-xs text-slate-400 space-y-2">
                {storeInfo.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <a href={`tel:${storeInfo.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-amber-400 transition-colors">
                      {storeInfo.phone}
                    </a>
                  </li>
                )}
                {storeInfo.phoneSecondary && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <a href={`tel:${storeInfo.phoneSecondary.replace(/[^0-9+]/g, '')}`} className="hover:text-amber-400 transition-colors">
                      {storeInfo.phoneSecondary}
                    </a>
                  </li>
                )}
                {storeInfo.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <a href={`mailto:${storeInfo.email}`} className="hover:text-amber-400 transition-colors">
                      {storeInfo.email}
                    </a>
                  </li>
                )}
                {storeInfo.address && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{storeInfo.address}</span>
                  </li>
                )}
                {storeInfo.workHours && (
                  <li className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{storeInfo.workHours}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Administration / Store Settings */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                Власникам магазину
              </h4>
              <div className="space-y-2 text-xs">
                {isAdmin ? (
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <p className="text-emerald-400 font-semibold mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Режим власника увімкнено
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsOrdersModalOpen(true)}
                      className="text-amber-400 hover:underline block mb-1 font-bold cursor-pointer flex items-center justify-between"
                    >
                      <span>📦 Замовлення та сповіщення</span>
                      {newOrdersCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black">
                          {newOrdersCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenAddProduct}
                      className="text-slate-300 hover:text-white block mb-1 cursor-pointer"
                    >
                      + Створити товар
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsStoreInfoModalOpen(true)}
                      className="text-amber-300 hover:underline block mb-1 font-medium cursor-pointer"
                    >
                      ⚙️ Редагувати інфо-блоки
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangePinOpen(true)}
                      className="text-slate-300 hover:text-white block mb-1 cursor-pointer"
                    >
                      Змінити PIN-код доступу
                    </button>
                    <button
                      type="button"
                      onClick={handleAdminLogout}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      Вийти з облікового запису
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAdminLoginOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium transition-colors w-full text-left cursor-pointer"
                  >
                    Вхід до кабінету власника
                  </button>
                )}
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} {storeInfo.brandName} {storeInfo.brandAccent}. Всі права захищено.</p>
            <p>100% безпечні матеріали (ECO PLA біополімер)</p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOpenCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        subtotal={totalCartSubtotal}
        discount={0}
        storeInfo={storeInfo}
        onOrderPlaced={handleCheckoutSuccess}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onSetCartQuantity={handleSetCartQuantity}
        cartQuantity={selectedProduct ? (cart.find(item => item.product.id === selectedProduct.id)?.quantity || 0) : 0}
        isInCart={selectedProduct ? cart.some(item => item.product.id === selectedProduct.id) : false}
        isAdmin={isAdmin}
        onEditProduct={handleOpenEditProduct}
        similarProducts={selectedProduct ? (similarProductsMap.get(selectedProduct.id) || []) : []}
        onSelectProduct={setSelectedProduct}
      />

      {/* Product Form Modal (Manual Add / Edit with photo upload) */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        initialProduct={editingProduct}
        existingCategories={categories}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLogin={handleAdminLogin}
        currentPin={adminPin}
      />

      {/* Change Admin PIN Modal */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onSuccess={(msg) => showToast(msg, 'success')}
        currentStoredPin={adminPin}
        onSavePin={handleSaveAdminPin}
      />

      {/* Store Info Edit Modal */}
      <StoreInfoModal
        isOpen={isStoreInfoModalOpen}
        onClose={() => setIsStoreInfoModalOpen(false)}
        currentInfo={storeInfo}
        onSave={handleSaveStoreInfo}
        onReset={handleResetStoreInfo}
      />

      {/* Orders Manager Modal with Notification Setup */}
      <OrdersManagerModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdateOrderTracking={handleUpdateOrderTracking}
        onUpdateOrderNotes={handleUpdateOrderNotes}
        onDeleteOrder={handleDeleteOrder}
        onClearAllOrders={handleClearAllOrders}
        notificationSettings={notificationSettings}
        onSaveNotificationSettings={handleSaveNotificationSettings}
        onCreateTestOrder={handleCreateTestOrder}
        storeBrandName={storeInfo.brandName}
      />

    </div>
  );
}
