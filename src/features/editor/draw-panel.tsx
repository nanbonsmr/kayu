import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PFText } from '@/components/ui/pf-text';
import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';

const COLORS = [
  '#FFFFFF','#000000','#F87171','#FB923C','#FBBF24',
  '#34D399','#60A5FA','#A78BFA','#F472B6','#E5E7EB',
  '#FCA5A5','#6EE7B7','#93C5FD','#C4B5FD','#FDE68A',
];

const TOOLS = [
  { id: 'pen'    as const, icon: '✏️', label: 'Pen'    },
  { id: 'marker' as const, icon: '🖊️', label: 'Marker' },
  { id: 'eraser' as const, icon: '🧹', label: 'Eraser' },
];

export function DrawPanel() {
  // All draw settings live in the store so the canvas can read them
  const drawColor   = useEditorStore((s) => s.drawColor);
  const drawSize    = useEditorStore((s) => s.drawSize);
  const drawOpacity = useEditorStore((s) => s.drawOpacity);
  const drawTool    = useEditorStore((s) => s.drawTool);
  const setDrawColor   = useEditorStore((s) => s.setDrawColor);
  const setDrawSize    = useEditorStore((s) => s.setDrawSize);
  const setDrawOpacity = useEditorStore((s) => s.setDrawOpacity);
  const setDrawTool    = useEditorStore((s) => s.setDrawTool);
  const clearDrawPaths = useEditorStore((s) => s.clearDrawPaths);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      {/* Tool selector */}
      <View style={styles.toolRow}>
        {TOOLS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setDrawTool(t.id)}
            style={({ pressed }) => [
              styles.toolBtn,
              drawTool === t.id && styles.toolBtnActive,
              pressed && styles.pressed,
            ]}>
            <PFText style={styles.toolIcon}>{t.icon}</PFText>
            <PFText style={[styles.toolLabel, drawTool === t.id && styles.toolLabelActive]}>
              {t.label}
            </PFText>
          </Pressable>
        ))}
        <Pressable
          onPress={clearDrawPaths}
          style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}>
          <PFText style={styles.clearLabel}>Clear</PFText>
        </Pressable>
      </View>

      {/* Color palette */}
      <View>
        <PFText style={styles.sectionLabel}>COLOR</PFText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorRow}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setDrawColor(c)}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                drawColor === c && styles.colorDotActive,
              ]}
            />
          ))}
        </ScrollView>
      </View>

      {/* Sliders */}
      <View style={styles.sliderBlock}>
        <View style={styles.sliderRow}>
          <PFText style={styles.sliderLabel}>Size</PFText>
          <View style={styles.sliderWrap}>
            <Slider value={drawSize} min={1} max={30} onChange={setDrawSize} accentColor={PF.accent} />
          </View>
          <PFText style={styles.sliderVal}>{Math.round(drawSize)}px</PFText>
        </View>
        <View style={styles.divider} />
        <View style={styles.sliderRow}>
          <PFText style={styles.sliderLabel}>Opacity</PFText>
          <View style={styles.sliderWrap}>
            <Slider value={drawOpacity} min={0.1} max={1} onChange={setDrawOpacity} accentColor={PF.accent} />
          </View>
          <PFText style={styles.sliderVal}>{Math.round(drawOpacity * 100)}%</PFText>
        </View>
      </View>

      {/* Live preview */}
      <View style={styles.preview}>
        <View style={[
          styles.previewDot,
          {
            width:        Math.max(drawSize * 2, 8),
            height:       Math.max(drawSize * 2, 8),
            borderRadius: drawSize + 4,
            backgroundColor: drawTool === 'eraser' ? PF.textMuted : drawColor,
            opacity: drawOpacity,
          },
        ]} />
        <PFText style={styles.previewLabel}>
          {drawTool === 'eraser' ? 'Eraser' : drawColor}
          {' · '}{Math.round(drawSize)}px{' · '}{Math.round(drawOpacity * 100)}%
        </PFText>
      </View>

      {/* Tip */}
      <View style={styles.tip}>
        <PFText style={styles.tipText}>✏️  Draw directly on the photo above</PFText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20, gap: 14 },

  toolRow: { flexDirection: 'row', gap: 8 },
  toolBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, backgroundColor: PF.bgElevated, gap: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: PF.border,
  },
  toolBtnActive:  { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  toolIcon:       { fontSize: 18 },
  toolLabel:      { fontSize: 10, fontWeight: '500', color: PF.textMuted },
  toolLabelActive:{ color: PF.accent, fontWeight: '700' },
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(248,113,113,0.1)', justifyContent: 'center',
  },
  clearLabel: { fontSize: 12, fontWeight: '600', color: PF.error },
  pressed:    { opacity: 0.65 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: PF.textMuted,
    letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase',
  },
  colorRow:       { gap: 8, paddingVertical: 2 },
  colorDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: PF.white, transform: [{ scale: 1.2 }] },

  sliderBlock: { backgroundColor: PF.bgElevated, borderRadius: 14, padding: 14, gap: 12 },
  sliderRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { fontSize: 12, fontWeight: '500', color: PF.textSecondary, width: 52 },
  sliderWrap:  { flex: 1 },
  sliderVal:   { fontSize: 11, fontWeight: '600', color: PF.accent, width: 40, textAlign: 'right' },
  divider:     { height: StyleSheet.hairlineWidth, backgroundColor: PF.border },

  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: PF.bgElevated, borderRadius: 12, padding: 12, minHeight: 46,
  },
  previewDot:   {},
  previewLabel: { fontSize: 11, fontWeight: '500', color: PF.textMuted },

  tip: {
    alignItems: 'center', paddingVertical: 10,
    backgroundColor: PF.accentDim, borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: PF.borderActive,
  },
  tipText: { fontSize: 12, fontWeight: '600', color: PF.accent },
});
