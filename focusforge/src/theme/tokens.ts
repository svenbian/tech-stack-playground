import type { Difficulty } from '@/domain/types';

/**
 * Design tokens. Soft, warm neutrals with a calm indigo accent; each
 * difficulty level gets its own gentle colour so users feel the mode at a glance.
 */

export interface Palette {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  ringTrack: string;
  shadow: string;
  difficulty: Record<Difficulty, { main: string; soft: string }>;
  /** Calm full-screen gradient stops for the block screen / active session. */
  calm: [string, string];
}

export const lightPalette: Palette = {
  background: '#F6F4F0',
  surface: '#FFFFFF',
  surfaceMuted: '#EFECE6',
  border: '#E6E1D9',
  text: '#1F2430',
  textMuted: '#5E6472',
  textSubtle: '#9AA0AC',
  primary: '#5B67E8',
  primarySoft: '#E7E9FC',
  onPrimary: '#FFFFFF',
  success: '#4E9F7D',
  successSoft: '#DFF0E7',
  warning: '#D8963E',
  warningSoft: '#FBEEDB',
  danger: '#D96B6B',
  dangerSoft: '#F9E3E3',
  ringTrack: '#ECE8E1',
  shadow: 'rgba(40, 36, 30, 0.08)',
  difficulty: {
    easy: { main: '#4E9F7D', soft: '#DFF0E7' },
    medium: { main: '#D8963E', soft: '#FBEEDB' },
    deep: { main: '#6A5AE0', soft: '#E9E5FB' },
  },
  calm: ['#EEF0FB', '#F7F1EA'],
};

export const darkPalette: Palette = {
  background: '#0F1115',
  surface: '#181B22',
  surfaceMuted: '#20242C',
  border: '#2A2F38',
  text: '#ECEEF3',
  textMuted: '#A3A9B6',
  textSubtle: '#6C7280',
  primary: '#8C95F5',
  primarySoft: '#262A4A',
  onPrimary: '#0F1115',
  success: '#7CC6A4',
  successSoft: '#1D3229',
  warning: '#EBB46A',
  warningSoft: '#3A2D1A',
  danger: '#EE9090',
  dangerSoft: '#3B2222',
  ringTrack: '#262A33',
  shadow: 'rgba(0, 0, 0, 0.4)',
  difficulty: {
    easy: { main: '#7CC6A4', soft: '#1D3229' },
    medium: { main: '#EBB46A', soft: '#3A2D1A' },
    deep: { main: '#A99CF5', soft: '#2A2547' },
  },
  calm: ['#141726', '#1A1715'],
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const type = {
  display: { fontSize: 44, fontWeight: '700' as const, letterSpacing: -1 },
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const },
  label: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.2 },
};
