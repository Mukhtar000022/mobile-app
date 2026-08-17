// Маска телефона: +7-777-777-77-77
// Пользователь может печатать как угодно (8707…, 707…, +7 707…) — приводим
// к единому виду. Сервер всё равно нормализует номер сам, поэтому вход
// не сломается, даже если формат в базе другой.

const MASK_GROUPS = [3, 3, 2, 2]; // 777-777-77-77
const PREFIX = '+7-';

/**
 * Оставляет 10 цифр самого номера, без кода страны.
 *
 * Важно: в поле уже показан префикс «+7-», и его семёрка НЕ является частью
 * номера. Поэтому сначала отрезаем префикс по строке, а не по цифрам —
 * иначе первая введённая цифра всегда превращалась бы в 7 и набрать
 * можно было бы только номера вида 77X.
 */
function localDigits(input: string): string {
  let s = String(input || '').trim();

  if (s.startsWith(PREFIX)) s = s.slice(PREFIX.length);
  else if (s.startsWith('+7')) s = s.slice(2);

  let d = s.replace(/\D/g, '');
  // Вставили номер целиком (8XXXXXXXXXX / 7XXXXXXXXXX) — убираем код страны.
  if (d.length > 10 && (d[0] === '8' || d[0] === '7')) d = d.slice(1);
  return d.slice(0, 10);
}

/** «7771234567» → «+7-777-123-45-67» (по мере ввода — частично). */
export function formatPhone(input: string): string {
  const d = localDigits(input);
  if (!d) return '';

  const parts: string[] = [];
  let pos = 0;
  for (const size of MASK_GROUPS) {
    if (pos >= d.length) break;
    parts.push(d.slice(pos, pos + size));
    pos += size;
  }
  return '+7-' + parts.join('-');
}

/** Готов ли номер к отправке (10 цифр). */
export function isPhoneComplete(input: string): boolean {
  return localDigits(input).length === 10;
}

/** Каноничный вид для сервера: +77771234567 */
export function phoneToApi(input: string): string {
  const d = localDigits(input);
  return d ? '+7' + d : '';
}
