import Constants from 'expo-constants';
import { Content } from './data/content';

const API_PORT = 4000;

// Адрес бэкенда определяем сами, чтобы «нет связи с сервером» не возникало
// при смене Wi-Fi или IP компьютера:
//   1) EXPO_PUBLIC_API_URL из .env — если задан явно (продакшен, свой сервер);
//   2) IP компьютера, на котором запущен Expo (Metro) — телефон видит именно его;
//   3) localhost — эмулятор/веб на том же компьютере.
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  // hostUri выглядит как "192.168.10.3:8081" — берём хост, порт свой.
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ||
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost ||
    '';
  const host = String(hostUri).split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:${API_PORT}`;

  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveApiUrl();

export async function fetchContent(): Promise<Content | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/content`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as Content;
  } catch (e) {
    return null;
  }
}

export type AuthUser = {
  id: number;
  phone_number: string;
  role: 'admin' | 'tutor' | 'parent';
};

export type LoginResult =
  | { ok: true; token: string; user: AuthUser }
  | { ok: false; error: string };

// Вход по телефону и паролю. Роль выбирать не нужно — сервер сам вернёт её
// в user.role, а приложение по ней покажет нужные разделы.
export async function apiLogin(phone_number: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, password }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'network' };
    return { ok: true, token: data.token, user: data.user };
  } catch (e) {
    return { ok: false, error: 'network' };
  }
}

export type StudentLite = { id: number; firstname: string; surname: string };
export type GroupLite = { id: number; name: string; students?: StudentLite[] };
export type Profile = {
  id: number;
  firstname: string;
  surname: string;
  group: GroupLite | null;
  students?: StudentLite[]; // для родителя
};

// Профиль текущего пользователя по роли:
//   parent → его дети + группа;  tutor → его группа + дети группы.
// status: 200 — ок, 404 — профиль не заполнен, 0 — нет связи.
export async function fetchProfile(
  role: 'tutor' | 'parent',
  token: string,
): Promise<{ ok: boolean; status: number; data: Profile | null }> {
  const path = role === 'tutor' ? '/api/tutors/me' : '/api/parents/me';
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data: res.ok ? data : null };
  } catch (e) {
    return { ok: false, status: 0, data: null };
  }
}

export type Lesson = {
  id: number;
  group_id: number;
  tutor_id: number | null;
  subject: string;
  weekday: number; // 1..6
  order_no: number;
  start_time: string;
  end_time: string;
  topic: string;
  homework: string;
  status: 'planned' | 'conducted' | 'canceled';
  group?: { id: number; name: string };
};

export type AttendanceRow = {
  id: number;
  lesson_id: number;
  student_id: number;
  date: string;
  present: boolean;
  note: string;
  student?: StudentLite;
};

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// Расписание своей группы (tutor → своя группа, parent → группа ребёнка).
export async function fetchMyLessons(token: string): Promise<Lesson[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lessons/my`, {
      headers: authHeaders(token),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return (await res.json()) as Lesson[];
  } catch (e) {
    return [];
  }
}

// Группа со списком детей (для отметки посещаемости).
export async function fetchGroup(
  id: number,
  token: string,
): Promise<{ id: number; name: string; students: StudentLite[] } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/groups/${id}`, {
      headers: authHeaders(token),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// Посещаемость по уроку на дату.
export async function fetchAttendance(
  lessonId: number,
  date: string,
  token: string,
): Promise<AttendanceRow[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/attendance?lesson_id=${lessonId}&date=${date}`, {
      headers: authHeaders(token),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return (await res.json()) as AttendanceRow[];
  } catch (e) {
    return [];
  }
}

// Отметить весь класс: records = [{ student_id, present }].
export async function markAttendanceBulk(
  lessonId: number,
  date: string,
  records: { student_id: number; present: boolean }[],
  token: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/attendance/bulk`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ lesson_id: lessonId, date, records }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export type PaymentSettings = {
  enabled: boolean;
  design: string;
  amount: string;
  title: string;
  kaspiUrl: string;
};

export type AppSettings = { payment: PaymentSettings };

export async function fetchSettings(): Promise<AppSettings | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as AppSettings;
  } catch (e) {
    return null;
  }
}

/**
 * Фиксирует платёж на сервере (журнал платежей в админ-панели).
 * Вызывается при открытии Kaspi. Не критично: при ошибке оплата в Kaspi продолжается.
 */
export async function logPayment(
  amount: string,
  opts: { name?: string; phone?: string; method?: string } = {},
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method: opts.method || 'kaspi', name: opts.name, phone: opts.phone }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    /* игнорируем — журнал не должен мешать оплате */
  }
}

export type LeadPayload = {
  type: 'consultation' | 'enroll';
  name: string;
  phone: string;
  message?: string;
};

export async function submitLead(payload: LeadPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Не удалось отправить заявку' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Нет соединения с сервером' };
  }
}
