import { Content } from './data/content';

// IMPORTANT: When testing on a real phone with Expo Go, "localhost" points at the
// phone itself, not your computer. Replace this with your computer's LAN IP,
// e.g. "http://192.168.1.23:4000" (see README.md for how to find it).
export const API_BASE_URL = 'http://localhost:4000';

export async function fetchContent(): Promise<Content | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/content`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as Content;
  } catch (e) {
    return null;
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
