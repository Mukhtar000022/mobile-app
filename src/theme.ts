export const colors = {
  bg: '#FFF7F3',
  text: '#3a2a22',
  muted: '#b08573',
  primary: '#D85A30',
  primaryDark: '#993C1D',
  heroBg: '#FAECE7',
  border: '#f1e4dd',
  white: '#ffffff',
  navInactive: '#c2a99d',
  scrim: 'rgba(40,20,12,0.42)',
};

export type PaletteKey = 'green' | 'orange' | 'yellow' | 'purple' | 'pink' | 'blue' | 'mint' | 'rose';

export const palettes: Record<PaletteKey, { bg: string; text: string; sub: string; icon: string; chevron: string }> = {
  green: { bg: '#E1F5EE', text: '#0F6E56', sub: '#5a9e88', icon: '#1D9E75', chevron: '#8bc0ad' },
  orange: { bg: '#FAECE7', text: '#993C1D', sub: '#b87b66', icon: '#F0997B', chevron: '#c89a8a' },
  yellow: { bg: '#FAEEDA', text: '#854F0B', sub: '#ab8748', icon: '#EF9F27', chevron: '#d4b072' },
  purple: { bg: '#EEEDFE', text: '#534AB7', sub: '#8780c4', icon: '#7F77DD', chevron: '#aaa3e0' },
  pink: { bg: '#FBEAF0', text: '#993556', sub: '#c07d96', icon: '#D4537E', chevron: '#dba9bd' },
  blue: { bg: '#E6F1FB', text: '#185FA5', sub: '#6a9fd4', icon: '#378ADD', chevron: '#9cc3ec' },
  mint: { bg: '#EAF3DE', text: '#3f6b1f', sub: '#7fa860', icon: '#5f9c34', chevron: '#a9cf8e' },
  rose: { bg: '#FCEBEB', text: '#a23a3a', sub: '#c98787', icon: '#E06767', chevron: '#e6b0b0' },
};

export const gradients: Record<string, [string, string]> = {
  balloon: ['#FBB89C', '#ED7A4E'],
};
