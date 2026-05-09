import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PFText } from '@/components/ui/pf-text';
import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';
import { Adjustments } from '@/types/editor';

interface Row { key: keyof Adjustments; label: string; icon: string; min: number; max: number }

const ROWS: Row[] = [
  { key: 'brightness',  label: 'Brightness',   icon: '☀️', min: -1, max: 1 },
  { key: 'contrast',    label: 'Contrast',     icon: '◑',  min: -1, max: 1 },
  { key: 'saturation',  label: 'Saturation',   icon: '🎨', min: -1, max: 1 },
  { key: 'exposure',    label: 'Exposure',     icon: '📷', min: -1, max: 1 },
  { key: 'highlights',  label: 'Highlights',   icon: '🔆', min: -1, max: 1 },
  { key: 'shadows',     label: 'Shadows',      icon: '🌑', min: -1, max: 1 },
  { key: 'temperature', label: 'Temperature',  icon: '🌡️', min: -1, max: 1 },
  { key: 'tint',        label: 'Tint',         icon: '🟢', min: -1, max: 1 },
  { key: 'sharpness',   label: 'Sharpness',    icon: '🔪', min:  0, max: 1 },
  { key: 'blur',        label: 'Blur',         icon: '💧', min:  0, max: 1 },
  { key: 'vignette',    label: 'Vignette',     icon: '⬛', min:  0, max: 1 },
];

export function AdjustPanel() {
  const adjustments    = useEditorStore((s) => s.adjustments);
  const setAdjustment  = useEditorStore((s) => s.setAdjustment);
  const resetAdjustments = useEditorStore((s) => s.resetAdjustments);

  const saveSnapshot = useEditorStore((s) => s.saveSnapshot);

  const handleChange = useCallback(
    (key: keyof Adjustments, v: number) => setAdjustment(key, v),
    [setAdjustment]
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      <View style={styles.header}>
        <PFText style={styles.heading}>Adjustments</PFText>
        <Pressable onPress={resetAdjustments} hitSlop={10}>
          <PFText style={styles.resetBtn}>Reset</PFText>
        </Pressable>
      </View>

      {ROWS.map((row) => {
        const val     = adjustments[row.key];
        const display = Math.round(val * 100);
        const active  = val !== 0;
        return (
          <View key={row.key} style={styles.row}>
            <View style={styles.rowMeta}>
              <PFText style={styles.rowIcon}>{row.icon}</PFText>
              <PFText style={styles.rowLabel}>{row.label}</PFText>
              <PFText style={[styles.rowVal, active && styles.rowValActive]}>
                {display > 0 ? `+${display}` : display}
              </PFText>
            </View>
            <Slider
              value={val}
              min={row.min}
              max={row.max}
              onChange={(v) => handleChange(row.key, v)}
              onChangeEnd={() => saveSnapshot(`Adjust ${row.label}`)}
              accentColor={active ? PF.accent : PF.textMuted}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 20, gap: 16 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  heading:  { fontSize: 13, fontWeight: '700', color: PF.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase' },
  resetBtn: { fontSize: 12, fontWeight: '600', color: PF.accent },

  row:     { gap: 7 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowIcon:  { fontSize: 14, width: 20 },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: PF.textPrimary },
  rowVal:   { fontSize: 12, fontWeight: '600', color: PF.textMuted, minWidth: 30, textAlign: 'right' },
  rowValActive: { color: PF.accent },
});
