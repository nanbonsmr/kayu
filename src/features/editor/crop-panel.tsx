import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';

const RATIOS = [
  { id: 'free',  label: 'Free',  icon: '⊞' },
  { id: '1:1',   label: '1:1',   icon: '□' },
  { id: '4:3',   label: '4:3',   icon: '▭' },
  { id: '3:4',   label: '3:4',   icon: '▯' },
  { id: '16:9',  label: '16:9',  icon: '▬' },
  { id: '9:16',  label: '9:16',  icon: '▮' },
  { id: '3:2',   label: '3:2',   icon: '▭' },
  { id: '2:3',   label: '2:3',   icon: '▯' },
];

export function CropPanel() {
  const cropState       = useEditorStore((s) => s.cropState);
  const setCropAspect   = useEditorStore((s) => s.setCropAspect);
  const setCropStraighten = useEditorStore((s) => s.setCropStraighten);
  const setRotation     = useEditorStore((s) => s.setRotation);
  const setFlip         = useEditorStore((s) => s.setFlip);
  const rotation        = useEditorStore((s) => s.rotation);
  const flipH           = useEditorStore((s) => s.flipH);
  const flipV           = useEditorStore((s) => s.flipV);
  const saveSnapshot    = useEditorStore((s) => s.saveSnapshot);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Aspect ratio */}
      <Text style={styles.sectionLabel}>ASPECT RATIO</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratioRow}>
        {RATIOS.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => { setCropAspect(r.id); saveSnapshot(`Crop: ${r.label}`); }}
            style={[styles.ratioBtn, cropState.aspectRatio === r.id && styles.ratioBtnActive]}>
            <Text style={styles.ratioIcon}>{r.icon}</Text>
            <Text style={[styles.ratioLabel, cropState.aspectRatio === r.id && styles.ratioLabelActive]}>
              {r.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Straighten */}
      <View style={styles.sliderBlock}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderTitle}>Straighten</Text>
          <Text style={[styles.sliderVal, cropState.straighten !== 0 && styles.sliderValActive]}>
            {cropState.straighten > 0 ? `+${cropState.straighten}` : cropState.straighten}°
          </Text>
        </View>
        <Slider
          value={cropState.straighten}
          min={-45}
          max={45}
          onChange={(v) => setCropStraighten(Math.round(v))}
          onChangeEnd={() => saveSnapshot('Straighten')}
          accentColor={PF.accent}
        />
        {/* Tick marks */}
        <View style={styles.ticks}>
          {[-45, -30, -15, 0, 15, 30, 45].map((t) => (
            <View key={t} style={styles.tickWrap}>
              <View style={[styles.tick, t === 0 && styles.tickCenter]} />
              <Text style={styles.tickLabel}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rotate & Flip */}
      <Text style={styles.sectionLabel}>ROTATE & FLIP</Text>
      <View style={styles.actionRow}>
        <Pressable onPress={() => setRotation((rotation - 90 + 360) % 360)} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>↺</Text>
          <Text style={styles.actionLabel}>Rotate L</Text>
        </Pressable>
        <Pressable onPress={() => setRotation((rotation + 90) % 360)} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>↻</Text>
          <Text style={styles.actionLabel}>Rotate R</Text>
        </Pressable>
        <Pressable
          onPress={() => setFlip(!flipH, flipV)}
          style={[styles.actionBtn, flipH && styles.actionBtnActive]}>
          <Text style={styles.actionIcon}>⇔</Text>
          <Text style={[styles.actionLabel, flipH && styles.actionLabelActive]}>Flip H</Text>
        </Pressable>
        <Pressable
          onPress={() => setFlip(flipH, !flipV)}
          style={[styles.actionBtn, flipV && styles.actionBtnActive]}>
          <Text style={styles.actionIcon}>⇕</Text>
          <Text style={[styles.actionLabel, flipV && styles.actionLabelActive]}>Flip V</Text>
        </Pressable>
      </View>

      {/* Fine rotation */}
      <View style={styles.sliderBlock}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderTitle}>Fine Rotation</Text>
          <Text style={[styles.sliderVal, rotation !== 0 && styles.sliderValActive]}>{rotation}°</Text>
        </View>
        <Slider value={rotation} min={0} max={360} onChange={(v) => setRotation(Math.round(v))} accentColor={PF.accent} />
      </View>

      {/* Reset */}
      <Pressable
        onPress={() => { setCropStraighten(0); setRotation(0); setFlip(false, false); setCropAspect('free'); }}
        style={styles.resetBtn}>
        <Text style={styles.resetLabel}>Reset All</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20, gap: 14 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: PF.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },

  ratioRow: { gap: 8, paddingVertical: 2 },
  ratioBtn: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border, gap: 4,
  },
  ratioBtnActive: { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  ratioIcon:  { fontSize: 16, color: PF.textSecondary },
  ratioLabel: { fontSize: 11, fontWeight: '600', color: PF.textMuted },
  ratioLabelActive: { color: PF.accent },

  sliderBlock: { backgroundColor: PF.bgElevated, borderRadius: 14, padding: 14, gap: 10 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderTitle:  { fontSize: 13, fontWeight: '600', color: PF.textPrimary },
  sliderVal:    { fontSize: 12, fontWeight: '600', color: PF.textMuted },
  sliderValActive: { color: PF.accent },

  ticks: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  tickWrap: { alignItems: 'center', gap: 2 },
  tick: { width: 1, height: 8, backgroundColor: PF.textMuted },
  tickCenter: { height: 12, backgroundColor: PF.accent },
  tickLabel: { fontSize: 8, color: PF.textMuted },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 12, backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border, gap: 4,
  },
  actionBtnActive: { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  actionIcon:  { fontSize: 20, color: PF.textPrimary },
  actionLabel: { fontSize: 10, fontWeight: '500', color: PF.textMuted },
  actionLabelActive: { color: PF.accent },

  resetBtn: {
    alignItems: 'center', paddingVertical: 12,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
  },
  resetLabel: { fontSize: 13, fontWeight: '600', color: PF.error },
});
