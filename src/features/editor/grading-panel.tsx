import React, { useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';

type Zone = 'shadows' | 'midtones' | 'highlights';

const ZONES: { id: Zone; label: string; color: string }[] = [
  { id: 'shadows',    label: 'Shadows',    color: '#60A5FA' },
  { id: 'midtones',   label: 'Midtones',   color: '#A78BFA' },
  { id: 'highlights', label: 'Highlights', color: '#FBBF24' },
];

const WHEEL_R = 80; // radius of color wheel

/** Simple color wheel picker — drag to set hue + saturation */
function ColorWheel({
  hue,
  saturation,
  color,
  onChange,
}: {
  hue: number;
  saturation: number;
  color: string;
  onChange: (hue: number, sat: number) => void;
}) {
  const size = WHEEL_R * 2;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        compute(locationX, locationY);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        compute(locationX, locationY);
      },
    })
  ).current;

  const compute = (lx: number, ly: number) => {
    const cx = lx - WHEEL_R;
    const cy = ly - WHEEL_R;
    const dist = Math.sqrt(cx * cx + cy * cy);
    const sat  = Math.min(dist / WHEEL_R, 1) * 100;
    const h    = ((Math.atan2(cy, cx) * 180) / Math.PI + 360) % 360;
    onChange(Math.round(h), Math.round(sat));
  };

  // Thumb position
  const rad = (hue * Math.PI) / 180;
  const r   = (saturation / 100) * WHEEL_R;
  const tx  = WHEEL_R + r * Math.cos(rad) - 8;
  const ty  = WHEEL_R + r * Math.sin(rad) - 8;

  // Build wheel segments as colored arcs (simplified as colored dots)
  const segments = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * 360;
    const rad2  = (angle * Math.PI) / 180;
    return {
      angle,
      x: WHEEL_R + WHEEL_R * 0.7 * Math.cos(rad2) - 6,
      y: WHEEL_R + WHEEL_R * 0.7 * Math.sin(rad2) - 6,
      color: `hsl(${angle}, 80%, 55%)`,
    };
  });

  return (
    <View
      style={[styles.wheel, { width: size, height: size }]}
      {...responder.panHandlers}>
      {/* Wheel background */}
      <View style={[styles.wheelBg, { width: size, height: size, borderRadius: WHEEL_R }]} />

      {/* Color segments */}
      {segments.map((s) => (
        <View
          key={s.angle}
          style={{
            position: 'absolute',
            left: s.x, top: s.y,
            width: 12, height: 12, borderRadius: 6,
            backgroundColor: s.color,
            opacity: 0.85,
          }}
        />
      ))}

      {/* Center white */}
      <View style={styles.wheelCenter} />

      {/* Thumb */}
      <View
        style={[
          styles.wheelThumb,
          { left: tx, top: ty, borderColor: color },
        ]}
      />
    </View>
  );
}

export function GradingPanel() {
  const colorGrading     = useEditorStore((s) => s.colorGrading);
  const setGradingTone   = useEditorStore((s) => s.setGradingTone);
  const setGradingBlending = useEditorStore((s) => s.setGradingBlending);
  const setGradingBalance  = useEditorStore((s) => s.setGradingBalance);
  const resetColorGrading  = useEditorStore((s) => s.resetColorGrading);

  const [activeZone, setActiveZone] = useState<Zone>('midtones');
  const zone = colorGrading[activeZone];
  const zoneColor = ZONES.find((z) => z.id === activeZone)?.color ?? '#fff';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>COLOR GRADING</Text>
        <Pressable onPress={resetColorGrading} hitSlop={10}>
          <Text style={styles.resetBtn}>Reset</Text>
        </Pressable>
      </View>

      {/* Zone tabs */}
      <View style={styles.zoneRow}>
        {ZONES.map((z) => (
          <Pressable
            key={z.id}
            onPress={() => setActiveZone(z.id)}
            style={[
              styles.zoneBtn,
              activeZone === z.id && { backgroundColor: z.color + '22', borderColor: z.color + '66' },
            ]}>
            <Text style={[styles.zoneLabel, activeZone === z.id && { color: z.color }]}>
              {z.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Color wheel */}
      <View style={styles.wheelWrap}>
        <ColorWheel
          hue={zone.hue}
          saturation={zone.saturation}
          color={zoneColor}
          onChange={(hue, sat) => setGradingTone(activeZone, { hue, saturation: sat })}
        />
        <View style={styles.wheelInfo}>
          <Text style={styles.wheelInfoText}>
            H: {zone.hue}°  S: {zone.saturation}%
          </Text>
        </View>
      </View>

      {/* Luminance slider */}
      <View style={styles.sliderBlock}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Luminance</Text>
          <View style={styles.sliderWrap}>
            <Slider
              value={zone.luminance}
              min={-100}
              max={100}
              onChange={(v) => setGradingTone(activeZone, { luminance: Math.round(v) })}
              accentColor={zoneColor}
            />
          </View>
          <Text style={[styles.sliderVal, { color: zone.luminance !== 0 ? zoneColor : PF.textMuted }]}>
            {zone.luminance > 0 ? `+${zone.luminance}` : zone.luminance}
          </Text>
        </View>
      </View>

      {/* Global controls */}
      <View style={styles.sliderBlock}>
        <Text style={styles.blockTitle}>GLOBAL</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Blending</Text>
          <View style={styles.sliderWrap}>
            <Slider
              value={colorGrading.blending}
              min={0}
              max={100}
              onChange={(v) => setGradingBlending(Math.round(v))}
              accentColor={PF.accent}
            />
          </View>
          <Text style={styles.sliderVal}>{colorGrading.blending}%</Text>
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Balance</Text>
          <View style={styles.sliderWrap}>
            <Slider
              value={colorGrading.balance}
              min={-100}
              max={100}
              onChange={(v) => setGradingBalance(Math.round(v))}
              accentColor={PF.accent}
            />
          </View>
          <Text style={[styles.sliderVal, { color: colorGrading.balance !== 0 ? PF.accent : PF.textMuted }]}>
            {colorGrading.balance > 0 ? `+${colorGrading.balance}` : colorGrading.balance}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20, gap: 14, alignItems: 'center' },

  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  heading:  { fontSize: 11, fontWeight: '700', color: PF.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  resetBtn: { fontSize: 12, fontWeight: '600', color: PF.accent },

  zoneRow: { flexDirection: 'row', gap: 8, width: '100%' },
  zoneBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border,
  },
  zoneLabel: { fontSize: 12, fontWeight: '600', color: PF.textMuted },

  wheelWrap: { alignItems: 'center', gap: 8 },
  wheel:     { position: 'relative' },
  wheelBg: {
    position: 'absolute',
    backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border,
  },
  wheelCenter: {
    position: 'absolute',
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: PF.bgCard,
    left: WHEEL_R - 12, top: WHEEL_R - 12,
    borderWidth: 1, borderColor: PF.border,
  },
  wheelThumb: {
    position: 'absolute',
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: PF.white,
    borderWidth: 2,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  wheelInfo: { alignItems: 'center' },
  wheelInfoText: { fontSize: 11, fontWeight: '600', color: PF.textSecondary },

  sliderBlock: { backgroundColor: PF.bgElevated, borderRadius: 14, padding: 14, gap: 12, width: '100%' },
  blockTitle:  { fontSize: 10, fontWeight: '700', color: PF.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  sliderRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { fontSize: 11, fontWeight: '500', color: PF.textSecondary, width: 72 },
  sliderWrap:  { flex: 1 },
  sliderVal:   { fontSize: 11, fontWeight: '700', color: PF.textMuted, width: 38, textAlign: 'right' },
});
