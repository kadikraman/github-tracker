export const colors = {
  bg: '#f3f2f2',
  bgRaised: '#f5f4f4',
  surface: '#eae9e9',
  text: '#201e1d',
  accent: '#ec3013',
  divider: 'rgba(32, 30, 29, 0.4)',
  dividerFaint: 'rgba(32, 30, 29, 0.18)',
  hoverText4: 'rgba(32, 30, 29, 0.04)',
  hoverText9: 'rgba(32, 30, 29, 0.09)',
  activeText16: 'rgba(32, 30, 29, 0.16)',
  neutral100: '#f8f4f4',
  neutral200: '#eae7e7',
  neutral300: '#d7d3d3',
  neutral400: '#bab6b6',
  neutral500: '#9b9797',
  neutral600: '#7d7979',
  neutral700: '#605d5d',
  neutral800: '#444141',
  neutral900: '#2d2b2b',
  accent100: '#fff2ef',
  accent600: '#dd2b0f',
  accent700: '#ae1800',
  accent800: '#7c1405',
} as const;

export const fonts = {
  body: 'Archivo_400Regular',
  semiBold: 'Archivo_600SemiBold',
  heading: 'Archivo_800ExtraBold',
} as const;

export const avatarPalette = [
  '#605d5d',
  '#7d7979',
  '#444141',
  '#9b9797',
  '#2d2b2b',
] as const;

export function avatarColor(login: string): string {
  let h = 0;
  for (const c of login) {
    h = (h * 31 + c.charCodeAt(0)) >>> 0;
  }
  return avatarPalette[h % avatarPalette.length] as string;
}
