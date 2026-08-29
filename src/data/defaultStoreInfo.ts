import { StoreInfo } from '../types';

export const DEFAULT_STORE_INFO: StoreInfo = {
  brandName: 'Майстерня',
  brandAccent: 'Треків',
  tagline: 'Кастомні деталі для дерев\'яних залізниць',
  badgeText: '3D Друк',
  
  topAnnouncement: '100% сумісність з рейками Brio, IKEA Lillabo, Hape',
  topSecondaryText: 'ECO PLA-пластик без запаху',
  
  heroBadge: 'Кастомні 3D-деталі для дерев\'яних залізниць',
  heroTitle: 'Кастомні 3D-друковані аксесуари та розширення для залізниць',
  heroDescription: 'Створюємо унікальні стрілки, розв\'язки, переходи та депо, які ідеально сумісні зі стандартними дерев\'яними рейками (Brio, IKEA Lillabo, Hape, Liliputien). Зробіть гру вашої дитини ще цікавішою та масштабнішою!',
  heroPrimaryBtnText: 'Переглянути каталог треків',
  
  trustBadges: [
    {
      id: 'badge-1',
      text: '100% сумісність з Brio та IKEA',
      iconType: 'sparkles'
    },
    {
      id: 'badge-2',
      text: 'Безпечний ECO PLA-пластик',
      iconType: 'shield'
    },
    {
      id: 'badge-3',
      text: 'Відправка 1-2 дні по Україні',
      iconType: 'truck'
    },
    {
      id: 'badge-4',
      text: 'Індивідуальні кольори деталей',
      iconType: 'zap'
    }
  ],
  
  phone: '+38 (099) 123-45-67',
  phoneSecondary: '+38 (067) 765-43-21',
  email: 'info@track-workshop.ua',
  address: 'Київ, Україна (Відправка Новою Поштою та Укрпоштою)',
  workHours: 'Пн-Сб: 09:00 - 20:00, Нд: 10:00 - 18:00',
  telegram: '@track_workshop_ua',
  viber: '+380991234567',
  instagram: '@track.workshop.ua',
  
  footerDescription: 'Кастомні 3D-друковані деталі, стрілки, розв\'язки та депо для дерев\'яних залізниць Brio, IKEA, Hape та інших.',
  compatibilityList: [
    'Brio (Швеція)',
    'IKEA Lillabo (ІКЕА)',
    'Hape & Viga Toys',
    'Edwone & Playtive',
    'Lego Duplo (через адаптери)'
  ]
};
