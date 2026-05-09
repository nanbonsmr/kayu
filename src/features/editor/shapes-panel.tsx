import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';
import { ShapeLayer, ShapeType } from '@/types/editor';
import { uid } from '@/utils/id';

const SHAPES: { type: ShapeType; label: string; preview: string }[] = [
  { type: 'rectangle', label: 'Rect',     preview: '▬' },
  { type: 'circle',    label: 'Circle',   preview: '●' },
  { type: 'triangle',  label: 'Triangle', preview: '▲' },
  { type: 'star',      label: 'Star',     preview: '★' },
  { type: 'heart',     label: 'Heart',    preview: '♥' },
  { type: 'arrow',     label: 'Arrow',    preview: '➤' },
];

const FILL_COLORS = [
  'transparent', '#FFFFFF', '#000000', '#F87171', '#FB923C',
  '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6',
];

const STROKE_COLORS = [
  '#FFFFFF', '#000000', '#F87171', '#FB923C', '#FBBF24',
  '#34D399', '#60A5FA', '#A78BFA', '#F472B6', 'transparent',
];

export function ShapesPanel() {
  const shapeLayers    = useEditorStore((s) => s.shapeLayers);
  const addShapeLayer  = useEditorStore((s) => s.addShapeLayer);
  const removeShapeLayer = useEditorStore((s) => s.removeShapeLayer);
  const updateShapeLayer = useEditorStore((s) => s.updateShapeLayer);

  const [fillColor,   setFillColor]   = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity,     setOpacity]     = useState(1);

  const addShape = (type: ShapeType) => {
    const layer: ShapeLayer = {
      id: uid(), type,
      x: 60, y: 80,
      width: 100, height: 100,
      rotation: 0,
      fillColor,
      strokeColor,
      strokeWidth,
      opacity,
    };
    addShapeLayer(layer);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Shape picker */}
      <Text style={styles.sectionLabel}>ADD SHAPE</Text>
      <View style={styles.shapeGrid}>
        {SHAPES.map((s) => (
          <Pressable
            key={s.type}
            onPress={() => addShape(s.type)}
            style={({ pressed }) => [styles.shapeBtn, pressed && styles.shapeBtnPressed]}>
            <Text style={styles.shapePreview}>{s.preview}</Text>
            <Text style={styles.shapeLabel}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Fill color */}
      <Text style={styles.sectionLabel}>FILL COLOR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
        {FILL_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setFillColor(c)}
            style={[
              styles.colorDot,
              c === 'transparent' ? styles.colorDotTransparent : { backgroundColor: c },
              fillColor === c && styles.colorDotActive,
            ]}>
            {c === 'transparent' && <Text style={styles.transparentX}>✕</Text>}
          </Pressable>
        ))}
      </ScrollView>

      {/* Stroke color */}
      <Text style={styles.sectionLabel}>STROKE COLOR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
        {STROKE_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setStrokeColor(c)}
            style={[
              styles.colorDot,
              c === 'transparent' ? styles.colorDotTransparent : { backgroundColor: c },
              strokeColor === c && styles.colorDotActive,
            ]}>
            {c === 'transparent' && <Text style={styles.transparentX}>✕</Text>}
          </Pressable>
        ))}
      </ScrollView>

      {/* Stroke width + opacity */}
      <View style={styles.sliderBlock}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Stroke</Text>
          <View style={styles.sliderWrap}>
            <Slider value={strokeWidth} min={0} max={20} onChange={(v) => setStrokeWidth(Math.round(v))} accentColor={PF.accent} />
          </View>
          <Text style={styles.sliderVal}>{strokeWidth}px</Text>
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Opacity</Text>
          <View style={styles.sliderWrap}>
            <Slider value={opacity} min={0.1} max={1} onChange={setOpacity} accentColor={PF.accent} />
          </View>
          <Text style={styles.sliderVal}>{Math.round(opacity * 100)}%</Text>
        </View>
      </View>

      {/* Existing shapes */}
      {shapeLayers.length > 0 && (
        <View style={styles.layerList}>
          <Text style={styles.sectionLabel}>LAYERS ({shapeLayers.length})</Text>
          {shapeLayers.map((layer) => (
            <View key={layer.id} style={styles.layerRow}>
              <Text style={styles.layerIcon}>
                {SHAPES.find((s) => s.type === layer.type)?.preview ?? '▬'}
              </Text>
              <View style={styles.layerInfo}>
                <Text style={styles.layerType}>{layer.type}</Text>
                <Text style={styles.layerMeta}>
                  {layer.width}×{layer.height} · {Math.round(layer.opacity * 100)}%
                </Text>
              </View>
              <Pressable onPress={() => removeShapeLayer(layer.id)} hitSlop={8} style={styles.deleteBtn}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.tip}>
        <Text style={styles.tipText}>Tap a shape to add · Drag to move · ⤡ to resize</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20, gap: 12 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: PF.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },

  shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shapeBtn: {
    width: '30%', alignItems: 'center', paddingVertical: 12,
    backgroundColor: PF.bgElevated, borderRadius: 14,
    borderWidth: 1, borderColor: PF.border, gap: 4,
  },
  shapeBtnPressed: { opacity: 0.6, transform: [{ scale: 0.94 }] },
  shapePreview: { fontSize: 26, color: PF.textPrimary },
  shapeLabel:   { fontSize: 10, fontWeight: '600', color: PF.textSecondary },

  colorRow: { gap: 8, paddingVertical: 2 },
  colorDot: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  colorDotTransparent: { backgroundColor: PF.bgElevated, borderColor: PF.border },
  colorDotActive: { borderColor: PF.white, transform: [{ scale: 1.2 }] },
  transparentX: { fontSize: 12, color: PF.error, fontWeight: '700' },

  sliderBlock: { backgroundColor: PF.bgElevated, borderRadius: 14, padding: 14, gap: 12 },
  sliderRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { fontSize: 11, fontWeight: '500', color: PF.textSecondary, width: 52 },
  sliderWrap:  { flex: 1 },
  sliderVal:   { fontSize: 11, fontWeight: '700', color: PF.accent, width: 40, textAlign: 'right' },

  layerList: { gap: 8 },
  layerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PF.bgElevated, borderRadius: 10,
    padding: 10, gap: 10,
    borderWidth: 1, borderColor: PF.border,
  },
  layerIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  layerInfo: { flex: 1, gap: 2 },
  layerType: { fontSize: 13, fontWeight: '600', color: PF.textPrimary, textTransform: 'capitalize' },
  layerMeta: { fontSize: 10, fontWeight: '400', color: PF.textMuted },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16 },

  tip: { alignItems: 'center', paddingVertical: 4 },
  tipText: { fontSize: 10, fontWeight: '400', color: PF.textMuted },
});
