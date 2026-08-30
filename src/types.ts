export interface Product {
  id: string;
  sku: string;
  title: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  inStock: boolean;
  imageUrl: string;
  description: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  specs?: Record<string, string>;
  lastUpdated?: string;
  priceChanged?: 'up' | 'down' | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SheetConfig {
  sheetId: string;
  sheetTabName: string;
  autoSync: boolean;
  syncIntervalSeconds: number;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  isOAuthConnected: boolean;
  userEmail?: string;
}

export interface SyncChangeLog {
  id: string;
  timestamp: string;
  type: 'price_change' | 'stock_change' | 'item_added' | 'item_removed' | 'initial_load';
  productId: string;
  productTitle: string;
  oldValue?: string | number;
  newValue?: string | number;
  message: string;
}

export interface OrderDetails {
  orderId: string;
  customerName: string;
  phone: string;
  city: string;
  deliveryType: 'nova_poshta' | 'ukrposhta' | 'pickup';
  deliveryAddress: string;
  paymentType: 'cash_on_delivery' | 'card_transfer' | 'card_online';
  comment?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  createdAt: string;
  status: 'new' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  trackingNumber?: string;
  internalNotes?: string;
  isRead?: boolean;
}

export interface NotificationSettings {
  viberNumber: string;
  viberAutoOpen: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  enableTelegram: boolean;
  webhookUrl?: string;
  enableWebhook: boolean;
  soundAlerts: boolean;
  browserNotifications: boolean;
  notificationEmail?: string;
}

export type SortOption = 
  | 'popular'
  | 'price_asc'
  | 'price_desc'
  | 'discount'
  | 'name_asc';

export interface TrustBadgeItem {
  id: string;
  text: string;
  iconType: 'sparkles' | 'shield' | 'truck' | 'zap' | 'heart' | 'check';
}

export interface StoreInfo {
  brandName: string;
  brandAccent: string;
  tagline: string;
  badgeText: string;
  topAnnouncement: string;
  topSecondaryText: string;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryBtnText: string;
  trustBadges: TrustBadgeItem[];
  phone: string;
  phoneSecondary?: string;
  email: string;
  address: string;
  workHours: string;
  telegram?: string;
  viber?: string;
  instagram?: string;
  footerDescription: string;
  compatibilityList: string[];
  cardNumber?: string;
  cardHolder?: string;
  cardBank?: string;
  cardPaymentInstructions?: string;
}

export interface AdminUser {
  email: string;
  name?: string;
  avatar?: string;
  loginMethod: 'google' | 'pin';
  loggedInAt: string;
}
