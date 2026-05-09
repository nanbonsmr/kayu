export const PF = {
  // Backgrounds — deep layered darks
  bg:          '#080810',
  bgCard:      '#0F0F1A',
  bgElevated:  '#161620',
  bgInput:     '#1A1A26',
  bgSheet:     '#12121C',

  // Accent — vivid violet
  accent:      '#7B61FF',
  accentLight: '#A48FFF',
  accentDim:   'rgba(123,97,255,0.15)',
  accentGlow:  'rgba(123,97,255,0.35)',

  // Gradient stops (used as string values in LinearGradient)
  gradStart:   '#7B61FF',
  gradEnd:     '#C084FC',

  // Text
  textPrimary:   '#EEEEF8',
  textSecondary: '#7878A0',
  textMuted:     '#3A3A55',

  // Status
  success: '#2DD4BF',
  error:   '#F87171',
  warning: '#FBBF24',

  // Borders
  border:       'rgba(255,255,255,0.06)',
  borderActive: 'rgba(123,97,255,0.55)',
  borderLight:  'rgba(255,255,255,0.12)',

  // Toolbar
  toolbarBg:     'rgba(8,8,16,0.97)',
  toolbarHeight: 62,

  // Misc
  overlay:     'rgba(0,0,0,0.75)',
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',

  // Pill / chip colours for quick actions
  violet: '#7B61FF',
  pink:   '#EC4899',
  orange: '#F97316',
  teal:   '#14B8A6',
  amber:  '#F59E0B',
  rose:   '#FB7185',
} as const;

export type PFColor = keyof typeof PF;
