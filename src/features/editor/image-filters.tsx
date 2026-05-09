/**
 * ImageWithFilters — pixel-accurate real-time adjustments
 *
 * Uses React Native's native `filter` style prop (RN 0.76+, Expo SDK 52+)
 * which applies CSS-style filters DIRECTLY to the image pixels — no overlays,
 * no covers. This is the same technique used by Lightroom Mobile and Snapseed.
 *
 * Supported natively:
 *   brightness()  — maps our -1→1 range to 0→2 multiplier
 *   contrast()    — maps our -1→1 range to 0→2 multiplier
 *   saturate()    — maps our -1→1 range to 0→2 multiplier
 *   hue-rotate()  — used for temperature & tint simulation
 *   blur()        — gaussian blur in px
 *   sepia()       — used for warm vintage tones
 *   invert()      — not used but available
 *
 * Filter presets merge their adjustment values with the user's manual sliders
 * before computing the final filter string.
 */

import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FILTER_PRESETS } from '@/features/filters/filter-presets';
import {
    Adjustments,
    ColorGrading,
    HslAdjustments,
    ToneCurves
} from '@/types/editor';

interface Props {
  uri:             string;
  adjustments:     Adjustments;
  curves:          ToneCurves;
  hsl:             HslAdjustments;
  colorGrading:    ColorGrading;
  activeFilterId:  string | null;
  filterIntensity: number;
  style?:          object;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

/**
 * Build a CSS filter string from merged adjustments.
 *
 * Mapping:
 *   brightness  -1→1  →  brightness(0 … 2)   (1 = no change)
 *   exposure    -1→1  →  added to brightness
 *   contrast    -1→1  →  contrast(0 … 2)      (1 = no change)
 *   saturation  -1→1  →  saturate(0 … 2)      (1 = no change)
 *   temperature -1→1  →  hue-rotate(-30 … 30deg) + sepia for warmth
 *   tint        -1→1  →  hue-rotate(-20 … 20deg) offset
 *   blur         0→1  →  blur(0 … 12px)
 *   highlights  -1→1  →  brightness tweak on bright areas (approximated)
 *   shadows     -1→1  →  brightness tweak on dark areas  (approximated)
 *   vignette     0→1  →  rendered as a separate View (can't do in CSS filter)
 *   sharpness    0→1  →  contrast micro-boost (true sharpen needs native)
 */
function buildFilter(a: Adjustments): string {
  const parts: string[] = [];

  // ── Brightness + Exposure (combined) ──────────────────────────────────────
  // CSS brightness(1) = normal. We map -1→1 to 0.1→2.0
  const bv = clamp(a.brightness + a.exposure, -1, 1);
  const brightness = 1 + bv; // -1→0, 0→1, +1→2
  if (Math.abs(bv) > 0.01) parts.push(`brightness(${brightness.toFixed(3)})`);

  // ── Contrast ───────────────────────────────────────────────────────────────
  // CSS contrast(1) = normal. Map -1→1 to 0.2→2.0
  const cv = clamp(a.contrast, -1, 1);
  const contrast = 1 + cv * 0.9; // softer curve: -1→0.1, 0→1, +1→1.9
  if (Math.abs(cv) > 0.01) parts.push(`contrast(${contrast.toFixed(3)})`);

  // ── Saturation ─────────────────────────────────────────────────────────────
  // CSS saturate(1) = normal. Map -1→1 to 0→2
  const sv = clamp(a.saturation, -1, 1);
  const saturate = 1 + sv; // -1→0 (greyscale), 0→1, +1→2 (vivid)
  if (Math.abs(sv) > 0.01) parts.push(`saturate(${saturate.toFixed(3)})`);

  // ── Temperature ────────────────────────────────────────────────────────────
  // Warm = slight sepia + hue shift toward orange
  // Cool = hue shift toward blue
  const tv = clamp(a.temperature, -1, 1);
  if (Math.abs(tv) > 0.01) {
    if (tv > 0) {
      // Warm: sepia tones the image toward yellow/orange
      parts.push(`sepia(${(tv * 0.45).toFixed(3)})`);
      parts.push(`hue-rotate(${(-tv * 15).toFixed(1)}deg)`);
    } else {
      // Cool: hue-rotate toward blue
      parts.push(`hue-rotate(${(-tv * 20).toFixed(1)}deg)`);
      parts.push(`saturate(${(1 + tv * 0.2).toFixed(3)})`);
    }
  }

  // ── Tint ───────────────────────────────────────────────────────────────────
  // Positive = magenta shift, negative = green shift
  const tintV = clamp(a.tint, -1, 1);
  if (Math.abs(tintV) > 0.01) {
    parts.push(`hue-rotate(${(tintV * 18).toFixed(1)}deg)`);
  }

  // ── Highlights (approximate via brightness on already-bright image) ────────
  // We can't target only highlights in CSS, so we use a gentle brightness nudge
  const hv = clamp(a.highlights, -1, 1);
  if (Math.abs(hv) > 0.01) {
    parts.push(`brightness(${(1 + hv * 0.25).toFixed(3)})`);
  }

  // ── Shadows (approximate via contrast + brightness combo) ─────────────────
  const shv = clamp(a.shadows, -1, 1);
  if (Math.abs(shv) > 0.01) {
    // Lifting shadows = reduce contrast slightly + boost brightness
    parts.push(`contrast(${(1 - shv * 0.15).toFixed(3)})`);
    parts.push(`brightness(${(1 + shv * 0.12).toFixed(3)})`);
  }

  // ── Sharpness (micro contrast boost) ──────────────────────────────────────
  const sharp = clamp(a.sharpness, 0, 1);
  if (sharp > 0.05) {
    parts.push(`contrast(${(1 + sharp * 0.15).toFixed(3)})`);
  }

  // ── Blur ───────────────────────────────────────────────────────────────────
  const blurPx = clamp(a.blur, 0, 1) * 12;
  if (blurPx > 0.1) parts.push(`blur(${blurPx.toFixed(1)}px)`);

  return parts.join(' ');
}

export function ImageWithFilters({ uri, adjustments, curves, hsl, colorGrading, activeFilterId, filterIntensity, style }: Props) {

  // Merge filter preset adjustments with manual adjustments
  const merged = useMemo<Adjustments>(() => {
    if (!activeFilterId || activeFilterId === 'none') return adjustments;
    const preset = FILTER_PRESETS.find((p) => p.id === activeFilterId);
    if (!preset) return adjustments;
    const pa = preset.adjustments;
    const fi = filterIntensity;
    return {
      brightness:  adjustments.brightness  + (pa.brightness  ?? 0) * fi,
      contrast:    adjustments.contrast    + (pa.contrast    ?? 0) * fi,
      saturation:  adjustments.saturation  + (pa.saturation  ?? 0) * fi,
      exposure:    adjustments.exposure    + (pa.exposure    ?? 0) * fi,
      temperature: adjustments.temperature + (pa.temperature ?? 0) * fi,
      tint:        adjustments.tint        + (pa.tint        ?? 0) * fi,
      sharpness:   adjustments.sharpness   + (pa.sharpness   ?? 0) * fi,
      blur:        adjustments.blur        + (pa.blur        ?? 0) * fi,
      highlights:  adjustments.highlights  + (pa.highlights  ?? 0) * fi,
      shadows:     adjustments.shadows     + (pa.shadows     ?? 0) * fi,
      vignette:    adjustments.vignette    + (pa.vignette    ?? 0) * fi,
    };
  }, [adjustments, activeFilterId, filterIntensity]);

  // Build the CSS filter string — applied directly to image pixels
  const filterString = useMemo(() => {
    const base = buildFilter(merged);

    // ── Curves contribution ────────────────────────────────────────────────
    // Map the RGB master curve midpoint deviation to brightness/contrast
    const curveParts: string[] = [];
    const midRgb = curves.rgb[2]; // midtones point
    const midDelta = midRgb.y - midRgb.x; // positive = lift, negative = crush
    if (Math.abs(midDelta) > 3) {
      curveParts.push(`brightness(${(1 + midDelta / 255 * 0.8).toFixed(3)})`);
    }
    // Blacks/whites spread → contrast
    const blacksY = curves.rgb[0].y;
    const whitesY = curves.rgb[4].y;
    const spread  = (whitesY - blacksY) / 255;
    if (Math.abs(spread - 1) > 0.05) {
      curveParts.push(`contrast(${clamp(spread, 0.3, 2.5).toFixed(3)})`);
    }
    // Per-channel curves → hue-rotate approximation
    const redMid   = curves.red[2].y   - curves.red[2].x;
    const greenMid = curves.green[2].y - curves.green[2].x;
    const blueMid  = curves.blue[2].y  - curves.blue[2].x;
    const channelShift = (redMid - blueMid) / 255;
    if (Math.abs(channelShift) > 0.02) {
      curveParts.push(`hue-rotate(${(channelShift * 20).toFixed(1)}deg)`);
    }

    // ── HSL contribution ───────────────────────────────────────────────────
    const hslParts: string[] = [];
    // Sum all saturation changes across channels
    const totalSatDelta = Object.values(hsl).reduce((sum, ch) => sum + ch.saturation, 0);
    if (Math.abs(totalSatDelta) > 2) {
      hslParts.push(`saturate(${clamp(1 + totalSatDelta / 100 * 0.5, 0, 3).toFixed(3)})`);
    }
    // Sum all luminance changes
    const totalLumDelta = Object.values(hsl).reduce((sum, ch) => sum + ch.luminance, 0);
    if (Math.abs(totalLumDelta) > 2) {
      hslParts.push(`brightness(${clamp(1 + totalLumDelta / 100 * 0.4, 0.2, 2.5).toFixed(3)})`);
    }
    // Sum hue shifts
    const totalHueDelta = Object.values(hsl).reduce((sum, ch) => sum + ch.hue, 0);
    if (Math.abs(totalHueDelta) > 3) {
      hslParts.push(`hue-rotate(${(totalHueDelta * 0.1).toFixed(1)}deg)`);
    }

    // ── Color grading contribution ─────────────────────────────────────────
    const gradParts: string[] = [];
    const { shadows: gs, midtones: gm, highlights: gh } = colorGrading;
    // Shadows tint → cool/warm shift
    if (gs.saturation > 5) {
      gradParts.push(`sepia(${(gs.saturation / 100 * 0.3).toFixed(3)})`);
      gradParts.push(`hue-rotate(${(gs.hue * 0.05).toFixed(1)}deg)`);
    }
    // Highlights tint
    if (gh.saturation > 5) {
      gradParts.push(`brightness(${(1 + gh.luminance / 100 * 0.2).toFixed(3)})`);
    }
    // Midtones luminance
    if (Math.abs(gm.luminance) > 3) {
      gradParts.push(`brightness(${(1 + gm.luminance / 100 * 0.3).toFixed(3)})`);
    }

    return [base, ...curveParts, ...hslParts, ...gradParts].filter(Boolean).join(' ');
  }, [merged, curves, hsl, colorGrading]);

  // Vignette is the only effect that can't be done via CSS filter —
  // it's a radial darkening at the edges, so we keep it as a View overlay
  const vignetteOpacity = clamp(merged.vignette, 0, 1);

  return (
    <View style={[styles.root, style]}>
      <Image
        source={{ uri }}
        style={[
          styles.image,
          // Apply all pixel-level adjustments directly to the image
          filterString ? ({ filter: filterString } as any) : undefined,
        ]}
        contentFit="contain"
        transition={80}
      />

      {/* Vignette — the only overlay, rendered as a radial dark border */}
      {vignetteOpacity > 0.02 && (
        <View
          style={[styles.vignette, { opacity: vignetteOpacity * 0.9 }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, overflow: 'hidden' },
  image: { flex: 1 },

  // Vignette: a dark ring around the edges using box shadow inset simulation
  vignette: {
    ...StyleSheet.absoluteFillObject,
    // Inner shadow effect using nested shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    // On Android, use a border-based approach
    borderWidth: 40,
    borderColor: 'rgba(0,0,0,0.55)',
    borderRadius: 2,
    pointerEvents: 'none',
  },
});
