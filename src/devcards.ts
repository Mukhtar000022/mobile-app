// Индивидуальная карта развития ребёнка (ИКР для НОБД).
// Воспитатель заполняет карты детей только своей группы — это проверяет сервер.
import { API_BASE_URL } from './api';

export type DevLevel = { key: 'formed' | 'partial' | 'not_formed'; label: string };
export type DevAgeGroup = { key: string; label: string };
export type DevSkill = { no: number; text: string };
export type DevArea = { key: string; label: string; skills: DevSkill[] };
export type DevCatalog = { key: string; label: string; areas: DevArea[] };

export type DevCard = {
  id: number;
  student_id: number;
  age_group: string;
  period: string;
  note: string;
  tutor: { id: number; firstname: string; surname: string } | null;
  updated_at: string;
  /** { [skill_no]: level } */
  marks: Record<string, string>;
};

export type DevCardView = {
  student: { id: number; firstname: string; surname: string; group: { id: number; name: string } | null };
  levels: DevLevel[];
  ageGroups: DevAgeGroup[];
  catalog?: DevCatalog;
  card?: DevCard | null;
};

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// Карта ребёнка в выбранной возрастной группе вместе со справочником навыков.
export async function fetchDevCard(
  studentId: number,
  ageGroup: string,
  token: string,
): Promise<DevCardView | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/devcards/student/${studentId}?age_group=${ageGroup}`, {
      headers: headers(token),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as DevCardView;
  } catch (e) {
    return null;
  }
}

// Сохранение оценок. marks: { [skill_no]: level | '' } — пустая строка снимает отметку.
export async function saveDevCard(
  studentId: number,
  payload: { age_group: string; period?: string; note?: string; marks: Record<string, string> },
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/devcards/student/${studentId}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: (data as any).error || 'Не удалось сохранить' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'network' };
  }
}
