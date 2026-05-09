import { FilterPreset } from '@/types/editor';

export interface FilterPresetWithMeta extends FilterPreset {
  premium: boolean;
}

// ─── FREE filters (12) ────────────────────────────────────────────────────────
// ─── PRO  filters (43) ────────────────────────────────────────────────────────
export const FILTER_PRESETS: FilterPresetWithMeta[] = [
  { id: 'none',          name: 'Original',      premium: false, intensity: 1, adjustments: {} },
  { id: 'vivid',         name: 'Vivid',         premium: false, intensity: 1, adjustments: { saturation: 0.4, contrast: 0.2, brightness: 0.05 } },
  { id: 'warm',          name: 'Warm',          premium: false, intensity: 1, adjustments: { temperature: 0.3, saturation: 0.1, brightness: 0.05 } },
  { id: 'cool',          name: 'Cool',          premium: false, intensity: 1, adjustments: { temperature: -0.3, saturation: 0.05, brightness: 0.05 } },
  { id: 'bw',            name: 'B&W',           premium: false, intensity: 1, adjustments: { saturation: -1, contrast: 0.15 } },
  { id: 'fade',          name: 'Fade',          premium: false, intensity: 1, adjustments: { brightness: 0.1, contrast: -0.2, saturation: -0.15 } },
  { id: 'matte',         name: 'Matte',         premium: false, intensity: 1, adjustments: { contrast: -0.15, saturation: -0.1, shadows: 0.2 } },
  { id: 'pastel',        name: 'Pastel',        premium: false, intensity: 1, adjustments: { saturation: -0.3, brightness: 0.15, contrast: -0.1 } },
  { id: 'vintage',       name: 'Vintage',       premium: false, intensity: 1, adjustments: { saturation: -0.2, temperature: 0.2, contrast: 0.1, brightness: -0.05, vignette: 0.4 } },
  { id: 'golden',        name: 'Golden',        premium: false, intensity: 1, adjustments: { temperature: 0.25, saturation: 0.2, brightness: 0.1, contrast: 0.1 } },
  { id: 'dramatic',      name: 'Dramatic',      premium: false, intensity: 1, adjustments: { contrast: 0.5, saturation: 0.2, shadows: -0.2, highlights: -0.15 } },
  { id: 'sepia',         name: 'Sepia',         premium: false, intensity: 1, adjustments: { saturation: -0.7, temperature: 0.35, contrast: 0.1, brightness: -0.03 } },

  // PRO — Cinema
  { id: 'cinematic',     name: 'Cinematic',     premium: true,  intensity: 1, adjustments: { contrast: 0.3, saturation: -0.1, temperature: -0.15, shadows: 0.1, highlights: -0.1 } },
  { id: 'noir',          name: 'Noir',          premium: true,  intensity: 1, adjustments: { saturation: -1, contrast: 0.45, brightness: -0.05, vignette: 0.6 } },
  { id: 'teal-orange',   name: 'Teal & Orange', premium: true,  intensity: 1, adjustments: { temperature: 0.2, tint: -0.15, saturation: 0.2, contrast: 0.25, shadows: 0.1 } },
  { id: 'blockbuster',   name: 'Blockbuster',   premium: true,  intensity: 1, adjustments: { contrast: 0.35, saturation: 0.15, temperature: 0.1, highlights: -0.2, shadows: -0.1, vignette: 0.3 } },
  { id: 'film-noir',     name: 'Film Noir',     premium: true,  intensity: 1, adjustments: { saturation: -0.9, contrast: 0.5, brightness: -0.1, vignette: 0.7, shadows: -0.2 } },
  { id: 'moody',         name: 'Moody',         premium: true,  intensity: 1, adjustments: { contrast: 0.25, saturation: -0.15, temperature: -0.1, shadows: -0.15, vignette: 0.4 } },
  { id: 'epic',          name: 'Epic',          premium: true,  intensity: 1, adjustments: { contrast: 0.4, saturation: 0.25, highlights: -0.2, shadows: -0.15, vignette: 0.35 } },

  // PRO — Vintage / Film
  { id: 'kodak',         name: 'Kodak',         premium: true,  intensity: 1, adjustments: { temperature: 0.15, saturation: 0.1, contrast: 0.1, brightness: 0.05, highlights: -0.05 } },
  { id: 'fuji',          name: 'Fuji',          premium: true,  intensity: 1, adjustments: { temperature: -0.05, saturation: 0.15, contrast: 0.08, tint: 0.05 } },
  { id: 'polaroid',      name: 'Polaroid',      premium: true,  intensity: 1, adjustments: { brightness: 0.1, contrast: -0.1, saturation: -0.1, temperature: 0.15, vignette: 0.25 } },
  { id: 'film-grain',    name: 'Film Grain',    premium: true,  intensity: 1, adjustments: { saturation: -0.15, contrast: 0.1, brightness: -0.03, vignette: 0.3 } },
  { id: 'retro-70s',     name: 'Retro 70s',     premium: true,  intensity: 1, adjustments: { temperature: 0.3, saturation: 0.15, contrast: -0.05, brightness: 0.05, vignette: 0.35 } },
  { id: 'retro-80s',     name: 'Retro 80s',     premium: true,  intensity: 1, adjustments: { saturation: 0.35, contrast: 0.2, temperature: 0.1, tint: 0.1 } },
  { id: 'cross-process', name: 'Cross Process', premium: true,  intensity: 1, adjustments: { saturation: 0.4, contrast: 0.35, temperature: -0.1, tint: 0.2 } },
  { id: 'lomo',          name: 'Lomo',          premium: true,  intensity: 1, adjustments: { saturation: 0.3, contrast: 0.4, vignette: 0.6, brightness: -0.05 } },

  // PRO — Mood
  { id: 'sunset',        name: 'Sunset',        premium: true,  intensity: 1, adjustments: { temperature: 0.4, saturation: 0.3, contrast: 0.15, highlights: -0.1 } },
  { id: 'sunrise',       name: 'Sunrise',       premium: true,  intensity: 1, adjustments: { temperature: 0.25, saturation: 0.15, brightness: 0.1, highlights: 0.1 } },
  { id: 'midnight',      name: 'Midnight',      premium: true,  intensity: 1, adjustments: { temperature: -0.35, saturation: -0.1, brightness: -0.15, contrast: 0.2, vignette: 0.5 } },
  { id: 'dusk',          name: 'Dusk',          premium: true,  intensity: 1, adjustments: { temperature: -0.1, saturation: 0.1, contrast: 0.15, brightness: -0.05, vignette: 0.3 } },
  { id: 'neon',          name: 'Neon',          premium: true,  intensity: 1, adjustments: { saturation: 0.6, contrast: 0.3, brightness: 0.05, tint: 0.15 } },
  { id: 'cyberpunk',     name: 'Cyberpunk',     premium: true,  intensity: 1, adjustments: { saturation: 0.5, contrast: 0.4, temperature: -0.2, tint: 0.2, vignette: 0.4 } },

  // PRO — Portrait
  { id: 'portrait',      name: 'Portrait',      premium: true,  intensity: 1, adjustments: { brightness: 0.08, contrast: 0.1, saturation: 0.05, highlights: -0.1, shadows: 0.15 } },
  { id: 'skin-glow',     name: 'Skin Glow',     premium: true,  intensity: 1, adjustments: { brightness: 0.12, saturation: 0.08, temperature: 0.1, highlights: 0.05 } },
  { id: 'soft-light',    name: 'Soft Light',    premium: true,  intensity: 1, adjustments: { brightness: 0.1, contrast: -0.1, saturation: -0.05, blur: 0.04 } },
  { id: 'beauty',        name: 'Beauty',        premium: true,  intensity: 1, adjustments: { brightness: 0.15, contrast: -0.05, saturation: 0.1, temperature: 0.08, highlights: -0.08 } },

  // PRO — Soft / Airy
  { id: 'airy',          name: 'Airy',          premium: true,  intensity: 1, adjustments: { brightness: 0.2, contrast: -0.15, saturation: -0.1, highlights: 0.1 } },
  { id: 'dreamy',        name: 'Dreamy',        premium: true,  intensity: 1, adjustments: { brightness: 0.12, saturation: -0.2, contrast: -0.12, blur: 0.06, temperature: 0.08 } },
  { id: 'haze',          name: 'Haze',          premium: true,  intensity: 1, adjustments: { brightness: 0.15, contrast: -0.25, saturation: -0.2, blur: 0.08 } },
  { id: 'soft-pink',     name: 'Soft Pink',     premium: true,  intensity: 1, adjustments: { temperature: 0.15, tint: 0.2, saturation: -0.1, brightness: 0.1, contrast: -0.08 } },
  { id: 'cotton-candy',  name: 'Cotton Candy',  premium: true,  intensity: 1, adjustments: { saturation: 0.15, tint: 0.25, brightness: 0.12, contrast: -0.05 } },

  // PRO — Bold
  { id: 'punch',         name: 'Punch',         premium: true,  intensity: 1, adjustments: { contrast: 0.35, saturation: 0.35, brightness: 0.05 } },
  { id: 'pop',           name: 'Pop',           premium: true,  intensity: 1, adjustments: { saturation: 0.5, contrast: 0.25, brightness: 0.08, highlights: -0.05 } },
  { id: 'chrome',        name: 'Chrome',        premium: true,  intensity: 1, adjustments: { contrast: 0.3, saturation: 0.1, highlights: 0.15, shadows: -0.1 } },

  // PRO — B&W
  { id: 'bw-high',       name: 'B&W High',      premium: true,  intensity: 1, adjustments: { saturation: -1, contrast: 0.5, brightness: -0.05 } },
  { id: 'bw-soft',       name: 'B&W Soft',      premium: true,  intensity: 1, adjustments: { saturation: -1, contrast: -0.1, brightness: 0.1 } },
  { id: 'silver',        name: 'Silver',        premium: true,  intensity: 1, adjustments: { saturation: -0.85, contrast: 0.1, brightness: 0.05 } },
  { id: 'charcoal',      name: 'Charcoal',      premium: true,  intensity: 1, adjustments: { saturation: -1, contrast: 0.6, brightness: -0.15, vignette: 0.5 } },

  // PRO — Nature
  { id: 'forest',        name: 'Forest',        premium: true,  intensity: 1, adjustments: { temperature: -0.1, saturation: 0.2, contrast: 0.15, shadows: 0.1 } },
  { id: 'ocean',         name: 'Ocean',         premium: true,  intensity: 1, adjustments: { temperature: -0.25, saturation: 0.2, contrast: 0.1, tint: -0.1 } },
  { id: 'desert',        name: 'Desert',        premium: true,  intensity: 1, adjustments: { temperature: 0.35, saturation: 0.1, contrast: 0.15, highlights: -0.1 } },
  { id: 'arctic',        name: 'Arctic',        premium: true,  intensity: 1, adjustments: { temperature: -0.4, saturation: -0.1, brightness: 0.1, contrast: 0.1 } },
  { id: 'tropical',      name: 'Tropical',      premium: true,  intensity: 1, adjustments: { saturation: 0.35, temperature: 0.1, contrast: 0.1, brightness: 0.05 } },
];

// ─── Categories ───────────────────────────────────────────────────────────────
export const FILTER_CATEGORIES: { id: string; label: string; ids: string[] }[] = [
  { id: 'all',      label: 'All',     ids: FILTER_PRESETS.map((f) => f.id) },
  { id: 'free',     label: 'Free',    ids: FILTER_PRESETS.filter((f) => !f.premium).map((f) => f.id) },
  { id: 'portrait', label: 'Portrait',ids: ['none', 'portrait', 'skin-glow', 'soft-light', 'beauty', 'warm', 'soft-pink', 'cotton-candy'] },
  { id: 'cinematic',label: 'Cinema',  ids: ['none', 'cinematic', 'noir', 'teal-orange', 'blockbuster', 'film-noir', 'moody', 'epic', 'dramatic'] },
  { id: 'vintage',  label: 'Vintage', ids: ['none', 'vintage', 'kodak', 'fuji', 'polaroid', 'film-grain', 'retro-70s', 'retro-80s', 'cross-process', 'lomo', 'sepia'] },
  { id: 'mood',     label: 'Mood',    ids: ['none', 'golden', 'sunset', 'sunrise', 'midnight', 'dusk', 'neon', 'cyberpunk', 'cool', 'warm'] },
  { id: 'soft',     label: 'Soft',    ids: ['none', 'fade', 'matte', 'pastel', 'airy', 'dreamy', 'haze', 'soft-pink', 'cotton-candy'] },
  { id: 'bw',       label: 'B&W',     ids: ['none', 'bw', 'bw-high', 'bw-soft', 'silver', 'sepia', 'charcoal', 'film-noir', 'noir'] },
  { id: 'nature',   label: 'Nature',  ids: ['none', 'forest', 'ocean', 'desert', 'arctic', 'tropical', 'golden', 'sunset'] },
];
