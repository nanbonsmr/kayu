import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';
import { HslColor } from '@/types/editor';

const COLORS: { id: HslColor; label: string; swatch: string }[] = [
  { id: 'red',     label: 'Red',     swatch: '#F87171' },
  { id: 'orange',  label: 'Orange',  swatch: '#FB923C' },
  { id: 'yellow',  label: 'Yellow',  swatch: '#FBBF24' },
  { id: 'green',   label: 'Green',   swatch: '#34D399' },
  { id: 'cyan',    label: 'Cyan',    swatch: '#22D3EE' },
  { id: 'blue',    label: 'Blue',    swatch: '#60A5FA' },
  { id: 'purple',  label: 'Purple',  swatch: '#A78BFA' },
  { id: 'magenta', label: 'Magenta', swatch: '#F472B6' },
];

type HslProp = 'hue' | 'saturation' | 'luminance';

const PROPS: { id: HslProp; label: string; min: number; max: number; unit: string }[] = [
  { id: 'hue',        label: 'Hue',        min: -180, max: 180, unit: '°' },
  { id: 'saturation', label: 'Saturation', min: -100, max: 100, unit: '' },
  { id: 'luminance',  label: 'Luminance',  min: -100, max: 100, unit: '' },
];

export function HslPanel() {
  const hsl          = useEditorStore((s) => s.hsl);
  const setHslChannel = useEditorStore((s) => s.setHslChannel);
  const resetHsl     = useEditorStore((s) => s.resetHsl);

  const [activeColor, setActiveColor] = useState<HslColor>('red');
  const [activeProp, setActiveProp]   = useState<HslProp>('hue');

  const swatch = COLORS.find((c) => c.id === activeColor)?.swatch ?? '#fff';
  const channel = hsl[activeColor];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>HSL / COLOR MIX</Text>
        <Pressable onPress={resetHsl} hitSlop={10}>
          <Text style={styles.resetBtn}>Reset</Text>
        </Pressable>
      </View>

      {/* Property tabs */}
      <View style={styles.propRow}>
        {PROPS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setActiveProp(p.id)}
            style={[styles.propBtn, activeProp === p.id && styles.propBtnActive]}>
            <Text style={[styles.propLabel, activeProp === p.id && styles.propLabelActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Color swatches */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchRow}>
        {COLORS.map((c) => {
          const ch = hsl[c.id];
          const hasChange = ch.hue !== 0 || ch.saturation !== 0 || ch.luminance !== 0;
          return (
            <Pressable
              key={c.id}
              onPress={() => setActiveColor(c.id)}
              style={[
                styles.swatch,
                { backgroundColor: c.swatch },
                activeColor === c.id && styles.swatchActive,
              ]}>
              {hasChange && <View style={styles.swatchDot} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Active color label */}
      <View style={styles.colorLabel}>
        <View style={[styles.colorDot, { backgroundColor: swatch }]} />
        <Text style={styles.colorName}>{COLORS.find((c) => c.id === activeColor)?.label}</Text>
      </View>

      {/* All three sliders for active color */}
      <View style={styles.sliderBlock}>
        {PROPS.map((p) => {
          const val = channel[p.id];
          const active = val !== 0;
          return (
            <View key={p.id} style={styles.sliderRow}>
              <Text style={[styles.sliderLabel, activeProp === p.id && { color: swatch }]}>
                {p.label}
              </Text>
              <View style={styles.sliderWrap}>
                <Slider
                  value={val}
                  min={p.min}
                  max={p.max}
                  onChange={(v) => setHslChannel(activeColor, { [p.id]: Math.round(v) })}
                  accentColor={active ? swatch : PF.textMuted}
                />
              </View>
              <Text style={[styles.sliderVal, active && { color: swatch }]}>
                {val > 0 ? `+${val}` : val}{p.unit}
              </Text>
            </View>
          );
        })}
      </View>

      {/* All colors summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>All Colors</Text>
        <View style={styles.summaryGrid}>
          {COLORS.map((c) => {
            const ch = hsl[c.id];
            const val = ch[activeProp];
            const active = val !== 0;
            return (
              <Pressable
                key={c.id}
                onPress={() => setActiveColor(c.id)}
                style={[styles.summaryItem, activeColor === c.id && styles.summaryItemActive]}>
                <View style={[styles.summaryDot, { backgroundColor: c.swatch }]} />
                <Text style={[styles.summaryVal, active && { color: c.swatch }]}>
                  {val > 0 ? `+${val}` : val}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20, gap: 14 },

  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading:  { fontSize: 11, fontWeight: '700', color: PF.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  resetBtn: { fontSize: 12, fontWeight: '600', color: PF.accent },

  propRow: { flexDirection: 'row', gap: 8 },
  propBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border,
  },
  propBtnActive: { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  propLabel:     { fontSize: 12, fontWeight: '500', color: PF.textMuted },
  propLabelActive: { color: PF.accent, fontWeight: '700' },

  swatchRow: { gap: 10, paddingVertical: 4 },
  swatch: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  swatchActive: { borderColor: PF.white, transform: [{ scale: 1.2 }] },
  swatchDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: PF.white, borderWidth: 1, borderColor: PF.bg,
  },

  colorLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot:   { width: 12, height: 12, borderRadius: 6 },
  colorName:  { fontSize: 14, fontWeight: '700', color: PF.textPrimary },

  sliderBlock: { backgroundColor: PF.bgElevated, borderRadius: 14, padding: 14, gap: 14 },
  sliderRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { fontSize: 11, fontWeight: '500', color: PF.textSecondary, width: 72 },
  sliderWrap:  { flex: 1 },
  sliderVal:   { fontSize: 11, fontWeight: '700', color: PF.textMuted, width: 38, textAlign: 'right' },

  summary:      { gap: 8 },
  summaryTitle: { fontSize: 11, fontWeight: '700', color: PF.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PF.bgElevated, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: PF.border,
  },
  summaryItemActive: { borderColor: PF.borderActive },
  summaryDot: { width: 10, height: 10, borderRadius: 5 },
  summaryVal: { fontSize: 11, fontWeight: '600', color: PF.textMuted },
});
