export type ScreenName =
  | 'cabinet'
  | 'routine'
  | 'attendance'
  | 'devcard'
  | 'day'
  | 'chat'
  | 'home'
  | 'contacts';

// Заголовки экранов берутся из переводов: t(`nav.${screen}`) (см. App.tsx).

// Разделы, которые воспитателю не нужны: он работает с группой, а не с
// витриной детского сада. Родителю они остаются.
export const TUTOR_HIDDEN: ScreenName[] = ['home'];

export function isHiddenFor(role: string | undefined, screen: ScreenName) {
  return role === 'tutor' && TUTOR_HIDDEN.includes(screen);
}
