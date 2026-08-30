import { OrderDetails, NotificationSettings } from '../types';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  viberNumber: '+380991234567',
  viberAutoOpen: false,
  telegramBotToken: '',
  telegramChatId: '',
  enableTelegram: false,
  webhookUrl: '',
  enableWebhook: false,
  soundAlerts: true,
  browserNotifications: true,
  notificationEmail: ''
};

// Play a pleasant chime using Web Audio API (no external asset dependencies)
export function playOrderSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number, volume: number = 0.2) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // Nice 3-note celebration chime (C5 -> E5 -> G5 -> C6)
    playTone(523.25, now, 0.25, 0.25);
    playTone(659.25, now + 0.12, 0.25, 0.25);
    playTone(783.99, now + 0.24, 0.35, 0.3);
    playTone(1046.50, now + 0.38, 0.6, 0.35);
  } catch (err) {
    console.warn('Audio chime could not be played:', err);
  }
}

// Request browser notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

// Show browser notification
export function showBrowserNotification(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=128&auto=format&fit=crop&q=80',
      });
    }
  } catch (e) {
    console.warn('Browser notification error', e);
  }
}

// Format order as clean markdown/plain text for messengers
export function formatOrderTextForMessenger(order: OrderDetails, storeBrand: string = 'Майстерня Треків'): string {
  const deliveryLabel = 
    order.deliveryType === 'nova_poshta' ? 'Нова Пошта' :
    order.deliveryType === 'ukrposhta' ? 'Укрпошта' : 'Самовивіз';
    
  const paymentLabel = 
    order.paymentType === 'cash_on_delivery' 
      ? 'Післяплата (при отриманні)' 
      : 'Оплата на карту (за реквізитами)';

  const itemsList = order.items
    .map((item, idx) => `${idx + 1}. ${item.product.title} — ${item.quantity} шт. × ${item.product.price} грн = ${item.quantity * item.product.price} грн`)
    .join('\n');

  return `🔔 НОВЕ ЗАМОВЛЕННЯ #${order.orderId}
🏬 Магазин: ${storeBrand}
⏰ Час: ${new Date(order.createdAt).toLocaleString('uk-UA')}

👤 Покупець: ${order.customerName}
📞 Телефон: ${order.phone}
📍 Місто: ${order.city}
🚚 Доставка: ${deliveryLabel} (${order.deliveryAddress})
💳 Оплата: ${paymentLabel}
${order.comment ? `💬 Коментар: ${order.comment}\n` : ''}
📦 Товари:
${itemsList}

💰 Разом до сплати: ${order.totalAmount} грн
(Сума: ${order.subtotal} грн, Доставка: ${order.deliveryFee} грн${order.discount ? `, Знижка: -${order.discount} грн` : ''})`;
}

// Generate direct Viber message links
export function getViberLinks(phoneOrNumber: string, messageText: string) {
  const cleanPhone = phoneOrNumber.replace(/[^0-9+]/g, '');
  const encodedText = encodeURIComponent(messageText);

  return {
    // Open chat with customer or owner
    chatUrl: `viber://chat?number=${cleanPhone}`,
    // Share / forward message via Viber dialog
    forwardUrl: `viber://forward?text=${encodedText}`,
    // Web fallback for mobile / desktop
    webUrl: `https://msng.link/vi/${cleanPhone.replace('+', '')}`
  };
}

// Send automatic notification via Telegram Bot API
export async function sendTelegramNotification(
  token: string,
  chatId: string,
  messageText: string
): Promise<{ success: boolean; error?: string }> {
  if (!token || !chatId) {
    return { success: false, error: 'Не заповнено Bot Token або Chat ID' };
  }

  try {
    const url = `https://api.telegram.org/bot${token.trim()}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: messageText,
        parse_mode: 'HTML'
      })
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description || 'Помилка Telegram API' };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Мережева помилка';
    return { success: false, error: msg };
  }
}

// Send Webhook notification
export async function sendWebhookNotification(
  webhookUrl: string,
  order: OrderDetails
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl) return { success: false, error: 'URL не вказано' };

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'new_order',
        timestamp: new Date().toISOString(),
        order
      })
    });

    if (res.ok) {
      return { success: true };
    } else {
      return { success: false, error: `Сервер повернув статус ${res.status}` };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка Webhook';
    return { success: false, error: msg };
  }
}

// Main notification dispatcher called when any new order arrives
export async function dispatchNewOrderNotifications(
  order: OrderDetails,
  settings: NotificationSettings,
  storeBrand: string = 'Майстерня Треків'
) {
  // 1. Play sound
  if (settings.soundAlerts) {
    playOrderSound();
  }

  // 2. Browser notification
  if (settings.browserNotifications) {
    showBrowserNotification(
      `🎉 Нове замовлення #${order.orderId}!`,
      `${order.customerName} (${order.phone}) на суму ${order.totalAmount} грн`
    );
  }

  const formattedText = formatOrderTextForMessenger(order, storeBrand);

  // 3. Telegram notification
  if (settings.enableTelegram && settings.telegramBotToken && settings.telegramChatId) {
    try {
      const htmlText = `🔔 <b>НОВЕ ЗАМОВЛЕННЯ #${order.orderId}</b>
🏬 <b>${storeBrand}</b>
⏰ ${new Date(order.createdAt).toLocaleString('uk-UA')}

👤 <b>Покупець:</b> ${order.customerName}
📞 <b>Телефон:</b> <code>${order.phone}</code>
📍 <b>Місто:</b> ${order.city}
🚚 <b>Доставка:</b> ${order.deliveryType === 'nova_poshta' ? 'Нова Пошта' : order.deliveryType === 'ukrposhta' ? 'Укрпошта' : 'Самовивіз'} (${order.deliveryAddress})
💳 <b>Оплата:</b> ${order.paymentType === 'cash_on_delivery' ? 'Післяплата' : 'Онлайн-оплата'}
${order.comment ? `💬 <b>Коментар:</b> <i>${order.comment}</i>\n` : ''}
📦 <b>Товари:</b>
${order.items.map((it, i) => `${i+1}. <b>${it.product.title}</b> — ${it.quantity} шт × ${it.product.price} грн`).join('\n')}

💰 <b>Всього до сплати: ${order.totalAmount} грн</b>`;

      await sendTelegramNotification(settings.telegramBotToken, settings.telegramChatId, htmlText);
    } catch (e) {
      console.warn('Telegram notification failed:', e);
    }
  }

  // 4. Webhook notification
  if (settings.enableWebhook && settings.webhookUrl) {
    try {
      await sendWebhookNotification(settings.webhookUrl, order);
    } catch (e) {
      console.warn('Webhook notification failed:', e);
    }
  }

  return formattedText;
}
