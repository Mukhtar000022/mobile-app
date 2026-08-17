// Жизнь группы: күн тәртібі, ас мәзірі, күнделікті есеп, суреттер.
// Заполняет воспитатель своей группы; родитель только смотрит и только своё.
import { API_BASE_URL } from './api';

export type Mood = 'happy' | 'calm' | 'sad' | 'sick' | '';

export type RoutineItem = { id?: number; time: string; title: string; subtitle: string };

// Ас мәзірі — 5 приёмов пищи в порядке дня.
export const MEAL_KEYS = ['breakfast', 'breakfast2', 'lunch', 'snack', 'dinner'] as const;
export type MealKey = (typeof MEAL_KEYS)[number];
export type Menu = Record<MealKey, string>;

export const emptyMenu = (): Menu =>
  MEAL_KEYS.reduce((acc, key) => ({ ...acc, [key]: '' }), {} as Menu);

export type DailyReport = {
  student_id: number;
  date: string;
  mood: Mood;
  sleep_minutes: number;
  meals_eaten: number;
  meals_total: number;
  note: string;
};

export type Photo = { id: number; url: string; caption: string; date: string };
export type PersonLite = { id: number; firstname: string; surname: string };
export type StudentWithReport = PersonLite & { report: DailyReport | null };

export type HomeData = {
  role: 'parent' | 'tutor';
  date: string;
  group: { id: number; name: string } | null;
  routine: RoutineItem[];
  menu: Menu;
  photos: Photo[];
  tutors: PersonLite[];
  child?: PersonLite | null;
  report?: DailyReport | null;
  students?: StudentWithReport[];
};

const H = (token: string) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

async function req<T>(path: string, token: string, init: RequestInit, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { ...H(token), ...(init.headers || {}) },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (e) {
    return fallback;
  }
}

/** Полный адрес картинки: сервер отдаёт относительный /uploads/... */
export const photoUrl = (url: string) => (url.startsWith('http') ? url : API_BASE_URL + url);

export const fetchHome = (token: string, date?: string) =>
  req<HomeData | null>(`/api/daycare/home${date ? `?date=${date}` : ''}`, token, {}, null);

/** Номер дня недели 1..7 (1 = понедельник) для указанной даты. */
export function weekdayOf(date = new Date()): number {
  const js = date.getDay(); // 0 = воскресенье
  return js === 0 ? 7 : js;
}

// Распорядок дня заполняет администратор. Запрашиваем именно текущий день
// недели — иначе пришли бы пункты сразу всех дней и список задвоился бы.
export const fetchRoutine = (token: string, weekday = weekdayOf()) =>
  req<RoutineItem[]>(`/api/daycare/routine?weekday=${weekday}`, token, {}, []);

export const fetchMenu = (date: string, token: string) =>
  req<Menu>(`/api/daycare/menu?date=${date}`, token, {}, emptyMenu());

export const saveMenu = (date: string, menu: Menu, token: string) =>
  req<Menu | null>('/api/daycare/menu', token, { method: 'PUT', body: JSON.stringify({ date, ...menu }) }, null);

export const fetchGroupReports = (date: string, token: string) =>
  req<{ student: PersonLite; report: DailyReport | null }[]>(`/api/daycare/reports?date=${date}`, token, {}, []);

export const saveReport = (
  payload: { student_id: number; date: string; mood: Mood; sleep_minutes: number; meals_eaten: number; meals_total: number; note: string },
  token: string,
) => req<DailyReport | null>('/api/daycare/report', token, { method: 'PUT', body: JSON.stringify(payload) }, null);

export const fetchPhotos = (date: string, token: string) =>
  req<Photo[]>(`/api/daycare/photos?date=${date}`, token, {}, []);

export const uploadPhoto = (data: string, date: string, caption: string, token: string) =>
  req<Photo | null>('/api/daycare/photos', token, {
    method: 'POST',
    body: JSON.stringify({ data, date, caption }),
  }, null);

export async function deletePhoto(id: number, token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/daycare/photos/${id}`, {
      method: 'DELETE',
      headers: H(token),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/** Сегодняшняя дата в формате YYYY-MM-DD по местному времени. */
export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** «1 с 40 м» из минут — как на макете. */
export function sleepLabel(minutes: number) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} с ${m} м` : `${m} м`;
}
