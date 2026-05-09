import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { PFText } from '@/components/ui/pf-text';
import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';

export function TransformPanel() {
  const rotation = useEditorStore((s) => s.rotation);
  const flipH    = useEditorStore((s) => s.flipH);
  const flipV    = useEditorStore((s) => s.flipV);
  const setRotation = useEditorStore((s) => s.setRotation);
  const setFlip     = useEditorStore((s) => s.setFlip);

  const rotate90      = () => setRotation((rotation + 90) % 360);
  const rotateMinus90 = () => setRotation((rotation - 90 + 360) % 360);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Quick action buttons */}
      <View style={styles.actionRow}>
        {[
          { icon: '↺', label: 'Rotate L', onPress: rotateMinus90, active: false },
          { icon: '↻', label: 'Rotate R', onPress: rotate90,      active: false },
          { icon: '⇔', label: 'Flip H',   onPress: () => setFlip(!flipH, flipV), active: flipH },
          { icon: '⇕', label: 'Flip V',   onPress: () => setFlip(flipH, !flipV), active: flipV },
        ].map((btn) => (
          <TouchableOpacity
            key={btn.label}
            onPress={btn.onPress}
            style={[styles.actionBtn, btn.active && styles.actionBtnActive]}>
            <PFText style={styles.actionIcon}>{btn.icon}</PFText>
            <PFText variant="micro" color={btn.active ? PF.accent : PF.textSecondary}>
              {btn.label}
            </PFText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fine rotation */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <PFText variant="caption" color={PF.textSecondary}>Fine Rotation</PFText>
          <PFText variant="caption" color={PF.accent}>{rotation}°</PFText>
        </View>
        <Slider value={rotation} min={0} max={360} onChange={setRotation} accentColor={PF.accent} />
      </View>

      {/* Reset */}
      <TouchableOpacity
        onPress={() => { setRotation(0); setFlip(false, false); }}
        style={styles.resetBtn}>
        <PFText variant="caption" color={PF.error}>Reset Transform</PFText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 14,
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: PF.bgElevated,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: PF.border,
  },
  actionBtnActive: {
    backgroundColor: PF.accentDim,
    borderColor: PF.borderActive,
  },
  actionIcon: { fontSize: 20, color: PF.textPrimary },
  sliderSection: {
    backgroundColor: PF.bgElevated,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 11,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 12,
  },
});
