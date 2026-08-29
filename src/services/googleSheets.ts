/// <reference types="vite/client" />
import { Product, SyncChangeLog } from '../types';
import { DEFAULT_PRODUCTS } from '../data/defaultCatalog';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

// Dynamically retrieve OAuth Client ID
export async function getOAuthClientId(): Promise<string> {
  const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (envClientId) {
    return envClientId;
  }
  try {
    const res = await fetch('/firebase-applet-config.json');
    if (res.ok) {
      const data = await res.json();
      if (data.oAuthClientId) return data.oAuthClientId;
    }
  } catch (e) {
    console.warn('Could not read firebase-applet-config.json', e);
  }
  // Fallback to configured OAuth Client ID for this project
  return '841899884031-usq0ar1q4mm8n4jpilb9tbv3iq9rbv7h.apps.googleusercontent.com';
}

// In-memory token storage
let currentAccessToken: string | null = null;
let tokenClientInstance: any = null;

export function getStoredAccessToken(): string | null {
  if (currentAccessToken) return currentAccessToken;
  return sessionStorage.getItem('google_sheet_oauth_token');
}

export function setStoredAccessToken(token: string | null): void {
  currentAccessToken = token;
  if (token) {
    sessionStorage.setItem('google_sheet_oauth_token', token);
  } else {
    sessionStorage.removeItem('google_sheet_oauth_token');
  }
}

export async function requestGoogleOAuthToken(): Promise<string> {
  const clientId = await getOAuthClientId();
  if (!clientId) {
    throw new Error('Google OAuth Client ID не знайдено в конфігурації.');
  }

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services скрипт ще завантажується. Спробуйте через декілька секунд.');
  }

  return new Promise((resolve, reject) => {
    try {
      tokenClientInstance = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly',
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(resp.error));
          } else if (resp.access_token) {
            setStoredAccessToken(resp.access_token);
            resolve(resp.access_token);
          } else {
            reject(new Error('Токен доступу не отримано.'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Помилка авторизації Google.'));
        }
      });

      tokenClientInstance.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(new Error(err.message || 'Не вдалося ініціалізувати Google OAuth'));
    }
  });
}

// Parse Google Sheet ID from full URL or return ID as-is
export function extractSheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If it's already a clean ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

// CSV row splitter that respects quotes
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

// Parse clean number from string (e.g. "1 499,00 грн" -> 1499)
export function parseNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val)
    .replace(/грн|₴|\$|€|usd|uah/gi, '')
    .replace(/\s+/g, '')
    .replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

// Normalize column headers to detect field meanings
export function mapHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};

  headers.forEach((header, idx) => {
    const h = header.toLowerCase().trim().replace(/[^a-zа-яіїєґ0-9]/gi, '');

    if (['id', 'код', 'артикул', 'sku', 'no', 'номер'].includes(h) && mapping.id === undefined) {
      mapping.id = idx;
    } else if (['назва', 'товар', 'title', 'name', 'найменування', 'продукт'].includes(h)) {
      mapping.title = idx;
    } else if (['ціна', 'price', 'cost', 'вартість', 'прайс', 'цінагрн'].includes(h)) {
      mapping.price = idx;
    } else if (['стараціна', 'oldprice', 'oldpriceгрн', 'знижка', 'акційнаціна', 'попередняціна'].includes(h)) {
      mapping.oldPrice = idx;
    } else if (['категорія', 'category', 'тип', 'розділ', 'група'].includes(h)) {
      mapping.category = idx;
    } else if (['наявність', 'кількість', 'stock', 'залишок', 'ксть', 'qty', 'instock'].includes(h)) {
      mapping.stock = idx;
    } else if (['зображення', 'фото', 'image', 'imageurl', 'photo', 'img', 'посиланнянафото', 'картинка'].includes(h)) {
      mapping.imageUrl = idx;
    } else if (['опис', 'description', 'деталі', 'інформація', 'info', 'характеристики'].includes(h)) {
      mapping.description = idx;
    } else if (['бейдж', 'badge', 'хіт', 'статус', 'позначка', 'маркер', 'акція'].includes(h)) {
      mapping.badge = idx;
    } else if (['рейтинг', 'rating', 'зірки'].includes(h)) {
      mapping.rating = idx;
    }
  });

  return mapping;
}

// Convert 2D table data into Product objects
export function convertTableToProducts(rows: any[][]): Product[] {
  if (!rows || rows.length < 2) return [];

  const headerRow = rows[0].map(h => String(h || ''));
  const mapping = mapHeaders(headerRow);

  // Fallback defaults if header matching was partial
  const idIdx = mapping.id ?? 0;
  const titleIdx = mapping.title ?? (rows[0].length > 1 ? 1 : 0);
  const priceIdx = mapping.price ?? (rows[0].length > 2 ? 2 : -1);
  const categoryIdx = mapping.category ?? (rows[0].length > 3 ? 3 : -1);
  const stockIdx = mapping.stock;
  const oldPriceIdx = mapping.oldPrice;
  const imageIdx = mapping.imageUrl;
  const descIdx = mapping.description;
  const badgeIdx = mapping.badge;
  const ratingIdx = mapping.rating;

  const products: Product[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawTitle = titleIdx >= 0 && row[titleIdx] ? String(row[titleIdx]).trim() : '';
    if (!rawTitle) continue; // skip blank rows

    const rawId = idIdx >= 0 && row[idIdx] ? String(row[idIdx]).trim() : `ITEM-${i}`;
    const price = priceIdx >= 0 ? parseNumber(row[priceIdx]) : 0;
    const oldPrice = oldPriceIdx !== undefined && row[oldPriceIdx] ? parseNumber(row[oldPriceIdx]) : undefined;
    const category = categoryIdx !== undefined && row[categoryIdx] ? String(row[categoryIdx]).trim() : 'Загальне';

    // Parse stock
    let stock = 10;
    let inStock = true;
    if (stockIdx !== undefined && row[stockIdx] !== undefined) {
      const valStr = String(row[stockIdx]).toLowerCase().trim();
      if (['немає', 'відсутній', '0', 'false', 'ні', 'out of stock'].includes(valStr)) {
        stock = 0;
        inStock = false;
      } else if (['є', 'в наявності', 'так', 'true', 'yes', 'in stock'].includes(valStr)) {
        stock = 10;
        inStock = true;
      } else {
        const num = parseNumber(row[stockIdx]);
        stock = isNaN(num) ? 0 : num;
        inStock = stock > 0;
      }
    }

    // Parse image
    let imageUrl = imageIdx !== undefined && row[imageIdx] ? String(row[imageIdx]).trim() : '';
    if (!imageUrl || !imageUrl.startsWith('http')) {
      // Fallback clean tech image
      imageUrl = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80';
    }

    const description = descIdx !== undefined && row[descIdx] ? String(row[descIdx]).trim() : '';
    const badge = badgeIdx !== undefined && row[badgeIdx] ? String(row[badgeIdx]).trim() : (oldPrice && oldPrice > price ? `Знижка -${Math.round((1 - price / oldPrice) * 100)}%` : undefined);
    const rating = ratingIdx !== undefined && row[ratingIdx] ? Math.min(5, Math.max(1, parseNumber(row[ratingIdx]))) : 4.8;

    products.push({
      id: rawId,
      sku: rawId,
      title: rawTitle,
      category: category || 'Різне',
      price: price || 0,
      oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
      stock,
      inStock,
      imageUrl,
      description: description || `Якісний товар "${rawTitle}" за привабливою ціною.`,
      badge: badge || undefined,
      rating: rating || 4.8,
      reviewsCount: Math.floor(Math.random() * 40) + 10,
      lastUpdated: new Date().toLocaleTimeString('uk-UA')
    });
  }

  return products;
}

// Detect changes between old and new products list
export function detectCatalogChanges(
  previousProducts: Product[],
  newProducts: Product[]
): {
  updatedProducts: Product[];
  changeLogs: SyncChangeLog[];
} {
  const changeLogs: SyncChangeLog[] = [];
  const prevMap = new Map(previousProducts.map(p => [p.id, p]));
  const currentTimestamp = new Date().toLocaleTimeString('uk-UA');

  const updatedProducts: Product[] = newProducts.map(newProd => {
    const prev = prevMap.get(newProd.id);
    let priceChanged: 'up' | 'down' | null = null;

    if (!prev) {
      // Newly added product
      changeLogs.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: currentTimestamp,
        type: 'item_added',
        productId: newProd.id,
        productTitle: newProd.title,
        newValue: `${newProd.price.toLocaleString('uk-UA')} ₴`,
        message: `Новий товар додано з таблиці: "${newProd.title}" (ціна ${newProd.price.toLocaleString('uk-UA')} ₴)`
      });
    } else {
      // Check price change
      if (prev.price !== newProd.price) {
        priceChanged = newProd.price > prev.price ? 'up' : 'down';
        const diff = Math.abs(newProd.price - prev.price);
        changeLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: currentTimestamp,
          type: 'price_change',
          productId: newProd.id,
          productTitle: newProd.title,
          oldValue: `${prev.price.toLocaleString('uk-UA')} ₴`,
          newValue: `${newProd.price.toLocaleString('uk-UA')} ₴`,
          message: `Ціну на "${newProd.title}" ${priceChanged === 'down' ? 'знижено' : 'підвищено'} на ${diff.toLocaleString('uk-UA')} ₴ (${prev.price.toLocaleString('uk-UA')} ₴ → ${newProd.price.toLocaleString('uk-UA')} ₴)`
        });
      }

      // Check stock status change
      if (prev.inStock !== newProd.inStock || prev.stock !== newProd.stock) {
        changeLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: currentTimestamp,
          type: 'stock_change',
          productId: newProd.id,
          productTitle: newProd.title,
          oldValue: prev.inStock ? `${prev.stock} шт.` : 'Немає',
          newValue: newProd.inStock ? `${newProd.stock} шт.` : 'Немає',
          message: `Наявність товару "${newProd.title}": ${newProd.inStock ? `в наявності (${newProd.stock} шт.)` : 'закінчився'}`
        });
      }
    }

    return {
      ...newProd,
      priceChanged
    };
  });

  return {
    updatedProducts,
    changeLogs
  };
}

// Fetch products from Google Sheets (OAuth API or Public CSV Export)
export async function fetchGoogleSheetCatalog(
  sheetId: string,
  tabName: string = 'Товари',
  token?: string | null
): Promise<Product[]> {
  const cleanId = extractSheetId(sheetId);
  if (!cleanId) {
    throw new Error('Вкажіть коректний ID або посилання на Google Таблицю.');
  }

  const effectiveToken = token || getStoredAccessToken();

  // Try 1: Google Sheets REST API v4 with OAuth token
  if (effectiveToken) {
    try {
      const range = encodeURIComponent(tabName ? `'${tabName}'!A1:Z500` : 'A1:Z500');
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${effectiveToken}`
        }
      });

      if (response.ok) {
        const json = await response.json();
        if (json.values && json.values.length > 1) {
          return convertTableToProducts(json.values);
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn('Sheets API v4 error, trying CSV fallback:', errJson);
        if (response.status === 401) {
          setStoredAccessToken(null); // Token expired
        }
      }
    } catch (e) {
      console.warn('Sheets API v4 fetch failed, trying CSV fallback:', e);
    }
  }

  // Try 2: Public Google Sheets CSV Export (Works for "Anyone with link" or "Published to web")
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName || 'Sheet1')}`;
  try {
    const csvResponse = await fetch(gvizUrl);
    if (csvResponse.ok) {
      const csvText = await csvResponse.text();
      // Google Visualization API returns HTML if not public or restricted
      if (!csvText.trim().startsWith('<!DOCTYPE') && !csvText.trim().startsWith('<html')) {
        const rows = parseCSV(csvText);
        if (rows.length > 1) {
          return convertTableToProducts(rows);
        }
      }
    }
  } catch (e) {
    console.warn('GVIZ CSV fetch failed, trying direct export:', e);
  }

  // Try 3: Direct CSV Export URL
  const exportUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&gid=0`;
  try {
    const res = await fetch(exportUrl);
    if (res.ok) {
      const text = await res.text();
      if (!text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
        const rows = parseCSV(text);
        if (rows.length > 1) {
          return convertTableToProducts(rows);
        }
      }
    }
  } catch (e) {
    console.warn('Direct export failed:', e);
  }

  throw new Error('Не вдалося завантажити дані з Google Таблиці. Перевірте доступ: зробіть таблицю доступною за посиланням (Перегляд) або натисніть "Увійти через Google" для приватної таблиці.');
}

/**
 * Converts a list of Product objects into a clean CSV string formatted for Google Sheets
 */
export function exportProductsToCSV(products: Product[]): string {
  const headers = ['ID', 'Артикул', 'Назва', 'Категорія', 'Ціна', 'Стара ціна', 'Наявність', 'Зображення', 'Опис', 'Бейдж', 'Рейтинг'];
  
  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '';
    const str = String(val).replace(/"/g, '""');
    if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes(';')) {
      return `"${str}"`;
    }
    return str;
  };

  const rows = products.map(p => [
    escapeCSV(p.id),
    escapeCSV(p.sku || ''),
    escapeCSV(p.title),
    escapeCSV(p.category),
    escapeCSV(p.price),
    escapeCSV(p.oldPrice || ''),
    escapeCSV(p.stock),
    escapeCSV(p.imageUrl),
    escapeCSV(p.description),
    escapeCSV(p.badge || ''),
    escapeCSV(p.rating || 5.0)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

