import { Linking, Alert } from 'react-native';
import { KASPI } from './config';

/**
 * Собирает итоговую ссылку Kaspi, подставляя сумму в шаблон {amount}, если он есть.
 * payUrl можно передать из настроек сервера; иначе берётся из config.ts (KASPI.payUrl).
 */
export function buildKaspiUrl(amount?: string, payUrl?: string): string {
  let url = payUrl || KASPI.payUrl;
  if (amount && url.includes('{amount}')) {
    const digits = amount.replace(/[^\d]/g, ''); // "15 000 ₸" -> "15000"
    url = url.replace('{amount}', digits);
  }
  return url;
}

/** Проверяет, что ссылка Kaspi реально настроена (не заглушка). */
export function isKaspiConfigured(payUrl?: string): boolean {
  const url = payUrl || KASPI.payUrl;
  return !!url && !url.includes('REPLACE_ME');
}

/**
 * Открывает Kaspi для оплаты. Возвращает true, если приложение/ссылка открылись.
 * Подтверждение самой оплаты происходит внутри Kaspi — автоматического
 * колбэка в приложение при QR/Pay нет (оплата видна в кабинете Kaspi Business).
 */
export async function openKaspiPayment(amount?: string, payUrl?: string): Promise<boolean> {
  if (!isKaspiConfigured(payUrl)) {
    Alert.alert(
      'Kaspi не настроен',
      'Укажите ссылку Kaspi Pay в админ-панели (Оплата) или в src/config.ts.',
    );
    return false;
  }
  const url = buildKaspiUrl(amount, payUrl);
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert(
      'Не удалось открыть Kaspi',
      'Проверьте, установлено ли приложение Kaspi.kz, или откройте ссылку оплаты вручную.',
    );
    return false;
  }
}
