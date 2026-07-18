import React from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const MCI_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  book: 'book-open-variant',
  users: 'account-group',
  photo: 'image-outline',
  confetti: 'party-popper',
  'clipboard-list': 'clipboard-list-outline',
  books: 'bookshelf',
  calendar: 'calendar-month-outline',
  run: 'run',
  heart: 'heart-outline',
  clock: 'clock-outline',
  soup: 'pot-steam-outline',
  ball: 'soccer',
  notebook: 'notebook-outline',
  coin: 'cash-multiple',
  palette: 'palette-outline',
  music: 'music-note-outline',
  abc: 'alphabetical-variant',
  'music-star': 'human-female-dance',
  chess: 'chess-knight',
  building: 'office-building-outline',
  phone: 'phone-outline',
  'device-mobile': 'cellphone',
  mail: 'email-outline',
  'map-pin': 'map-marker-outline',
};

const ION_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  'menu-2': 'menu',
  'arrow-left': 'arrow-back',
  'chevron-right': 'chevron-forward',
  'chevron-down': 'chevron-down',
  x: 'close',
  home: 'home',
  'brand-instagram': 'logo-instagram',
  'brand-facebook': 'logo-facebook',
  'brand-whatsapp': 'logo-whatsapp',
};

type Props = { name: string; size?: number; color?: string };

export default function AppIcon({ name, size = 20, color = '#3a2a22' }: Props) {
  if (ION_MAP[name]) {
    return <Ionicons name={ION_MAP[name]} size={size} color={color} />;
  }
  const mciName = MCI_MAP[name] || 'help-circle-outline';
  return <MaterialCommunityIcons name={mciName} size={size} color={color} />;
}
