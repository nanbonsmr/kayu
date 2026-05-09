/**
 * EditStyle — a portable, shareable bundle of all non-destructive edit settings.
 * Can be copied from one photo and pasted onto another, saved as a named preset,
 * or exported/imported as JSON (compatible with any app that uses this format).
 */

import {
    Adjustments,
    ColorGrading,
    HslAdjustments,
    ToneCurves,
} from '@/types/editor';

export interface EditStyle {
  // ── Identity ────────────────────────────────────────────────────────────────
  id:          string;
  name:        string;
  description: string;
  createdAt:   number;
  updatedAt:   number;
  /** App that created this style — 'pixelforge' or any external identifier */
  source:      string;
  /** Semantic version of the style format */
  version:     '1.0';

  // ── What to include when pasting ────────────────────────────────────────────
  include: {
    adjustments:  boolean;
    curves:       boolean;
    hsl:          boolean;
    colorGrading: boolean;
    filter:       boolean;
  };

  // ── The actual settings ──────────────────────────────────────────────────────
  adjustments:     Adjustments;
  curves:          ToneCurves;
  hsl:             HslAdjustments;
  colorGrading:    ColorGrading;
  activeFilterId:  string | null;
  filterIntensity: number;
}

/** What the user can selectively choose to paste */
export type StyleSection = keyof EditStyle['include'];

export const STYLE_SECTIONS: { key: StyleSection; label: string; icon: string }[] = [
  { key: 'adjustments',  label: 'Adjustments',   icon: '🎚️' },
  { key: 'curves',       label: 'Tone Curve',     icon: '📈' },
  { key: 'hsl',          label: 'HSL / Color Mix',icon: '🌈' },
  { key: 'colorGrading', label: 'Color Grading',  icon: '🎨' },
  { key: 'filter',       label: 'Filter',         icon: '🎞️' },
];
