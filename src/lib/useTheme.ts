import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

export const LIGHT = {
  bg:             '#F2F7F2',   // very light green tint
  surface:        '#FFFFFF',
  surfaceTinted:  '#EBF5EC',   // light green card tint
  surfaceWarm:    '#FDF8F0',   // cream card tint
  border:         '#DDE8DC',
  borderStrong:   '#B8D4B8',
  text:           '#1A1A1A',
  textSec:        '#4A5C48',   // dark green-gray
  textMuted:      '#7A9078',
  header:         '#2E4820',
  accent:         '#6DB882',
  primary:        '#2E4820',
  warm:           '#C4944A',
  copper:         '#8B5E3C',
  cream:          '#E8C9A0',
  tabBg:          '#F0F7F0',
  tabBorder:      '#C8DCC8',
  sectionLabel:   '#3A5C28',
  danger:         '#DC2626',
} as const;

export const DARK = {
  bg:             '#0D1A09',
  surface:        '#152810',
  surfaceTinted:  '#1A3015',
  surfaceWarm:    '#1E2A18',
  border:         '#263E20',
  borderStrong:   '#3A5228',
  text:           '#E8EDE6',
  textSec:        '#9DB890',
  textMuted:      '#5A7855',
  header:         '#0F2009',
  accent:         '#6DB882',
  primary:        '#8DD49E',
  warm:           '#D4A45A',
  copper:         '#B08060',
  cream:          '#C8A870',
  tabBg:          '#0F2009',
  tabBorder:      '#263E20',
  sectionLabel:   '#6DB882',
  danger:         '#F87171',
} as const;

export type AppColors = typeof LIGHT;

export function useTheme() {
  const system = useColorScheme();
  const pref   = useThemeStore((s) => s.colorScheme);
  const isDark = pref === 'dark' || (pref === 'system' && system === 'dark');
  return { isDark, colors: isDark ? DARK : LIGHT } as const;
}
