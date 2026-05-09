import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PFText } from '@/components/ui/pf-text';
import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';

const EFFECTS = [
  { id: 'blur',    label: 'Blur',     icon: '💧', key: 'blur'      as const, color: PF.teal   },
  { id: 'vignette',label: 'Vignette', icon: '⬛', key: 'vignette'  as const, color: PF.violet },
  { id: 'sharpen', label: 'Sharpen',  icon: '🔪', key: 'sharpness' as const, color: PF.amber  },
];

const BLUR_PRESETS = [
  { label: 'None',   value: 0    },
  { label: 'Soft',   value: 0.2  },
  { label: 'Medium', value: 0.5  },
  { label: 'Heavy',  value: 0.85 },
];

export function EffectsPanel() {
  const adjustments  = useEditorStore((s) => s.adjustments);
  const setAdjustment = useEditorStore((s) => s.setAdjustment);
  const saveSnapshot  = useEditorStore((s) => s.saveSnapshot);
  const [activeEffect, setActiveEffect] = useState<string | null>(null);

  const active = EFFECTS.find((e) => e.id === activeEffect);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Effect cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow} style={styles.cardStrip}>
        {EFFECTS.map((e) => {
          const val    = adjustments[e.key];
          const isOn   = activeEffect === e.id;
          return (
            <Pressable
              key={e.id}
              onPress={() => setActiveEffect(isOn ? null : e.id)}
              style={({ pressed }) => [styles.card, isOn && styles.cardOn, pressed && styles.pressed]}>
              <View style={[styles.cardIconWrap, { backgroundColor: e.color + '22' }]}>
                <PFText style={styles.cardIcon}>{e.icon}</PFText>
              </View>
              <PFText style={[styles.cardLabel, isOn && styles.cardLabelOn]}>{e.label}</PFText>
              {val > 0 && <View style={[styles.activePip, { backgroundColor: e.color }]} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Active slider */}
      {active && (
        <View style={styles.sliderCard}>
          <View style={styles.sliderHeader}>
            <PFText style={styles.sliderTitle}>{active.icon}  {active.label}</PFText>
            <PFText style={styles.sliderVal}>{Math.round(adjustments[active.key] * 100)}%</PFText>
          </View>
          <Slider
            value={adjustments[active.key]}
            min={0}
            max={1}
            onChange={(v) => setAdjustment(active.key, v)}
            onChangeEnd={() => saveSnapshot(`Effect: ${active.label}`)}
            accentColor={active.color}
          />
        </View>
      )}

      {/* Blur presets */}
      <View style={styles.presetsSection}>
        <PFText style={styles.presetsTitle}>BLUR PRESETS</PFText>
        <View style={styles.presetsRow}>
          {BLUR_PRESETS.map((p) => {
            const match = Math.abs(adjustments.blur - p.value) < 0.05;
            return (
              <Pressable
                key={p.label}
                onPress={() => { setAdjustment('blur', p.value); saveSnapshot(`Blur: ${p.label}`); }}
                style={({ pressed }) => [styles.preset, match && styles.presetActive, pressed && styles.pressed]}>
                <PFText style={[styles.presetLabel, match && styles.presetLabelActive]}>{p.label}</PFText>
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

  cardStrip: { flexGrow: 0 },
  cardRow:   { gap: 10, paddingVertical: 2 },
  card: {
    alignItems: 'center',
    backgroundColor: PF.bgElevated,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 7,
    minWidth: 90,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PF.border,
    position: 'relative',
  },
  cardOn:      { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  pressed:     { opacity: 0.65 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardIcon:    { fontSize: 22 },
  cardLabel:   { fontSize: 11, fontWeight: '500', color: PF.textMuted },
  cardLabelOn: { color: PF.accent, fontWeight: '700' },
  activePip: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  sliderCard: {
    backgroundColor: PF.bgElevated,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderTitle:  { fontSize: 13, fontWeight: '600', color: PF.textPrimary },
  sliderVal:    { fontSize: 12, fontWeight: '600', color: PF.accent },

  presetsSection: { gap: 8 },
  presetsTitle:   { fontSize: 10, fontWeight: '700', color: PF.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  presetsRow:     { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    backgroundColor: PF.bgElevated,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PF.border,
  },
  presetActive:      { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  presetLabel:       { fontSize: 12, fontWeight: '500', color: PF.textSecondary },
  presetLabelActive: { color: PF.accent, fontWeight: '700' },
});
