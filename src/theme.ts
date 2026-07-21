export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type Palette = {
  appBg: string;
  card: string;
  cardHover: string;
  sunken: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  sep: string;
  titlebar: string;
  review: string;
  mentioned: string;
  prs: string;
  issues: string;
  danger: string;
  success: string;
  shadow: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
  };
};

export const lightPalette: Palette = {
  appBg: '#f4f5f8',
  card: '#ffffff',
  cardHover: '#f6f7f9',
  sunken: 'rgba(20, 22, 28, 0.06)',
  text: '#1a1d23',
  muted: '#656c77',
  faint: '#979ea9',
  border: 'rgba(20, 22, 28, 0.09)',
  sep: 'rgba(20, 22, 28, 0.07)',
  titlebar: '#fbfcfd',
  review: '#7c5cff',
  mentioned: '#e0850a',
  prs: '#12a150',
  issues: '#2f74e0',
  danger: '#e5484d',
  success: '#12a150',
  shadow: {
    shadowColor: '#14161c',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
};

export const darkPalette: Palette = {
  appBg: '#15171c',
  card: '#1e222a',
  cardHover: '#262b34',
  sunken: 'rgba(255, 255, 255, 0.07)',
  text: '#e8eaef',
  muted: '#9aa1ad',
  faint: '#6b7280',
  border: 'rgba(255, 255, 255, 0.09)',
  sep: 'rgba(255, 255, 255, 0.07)',
  titlebar: '#1a1c23',
  review: '#a68bff',
  mentioned: '#f5b13d',
  prs: '#3ad07e',
  issues: '#6aa4ff',
  danger: '#ff7076',
  success: '#3ad07e',
  shadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
};

/** rgba() from a #rrggbb hex — runtime stand-in for CSS color-mix. */
export function alpha(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** App badge — solid blend of the design's #8b6dff → #4d8bff gradient. */
export const appBadgeColor = '#6c7cff';

