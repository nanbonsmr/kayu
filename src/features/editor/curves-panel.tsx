import React, { useState } from 'react';
import {
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';
import { CurvePoint, ToneCurves } from '@/types/editor';

type Channel = keyof ToneCurves;

const CHANNELS: { id: Channel; label: string; color: string }[] = [
  { id: 'rgb',   label: 'RGB',   color: '#FFFFFF' },
  { id: 'red',   label: 'Red',   color: '#F87171' },
  { id: 'green', label: 'Green', color: '#34D399' },
  { id: 'blue',  label: 'Blue',  color: '#60A5FA' },
];

const GRAPH = 220; // graph size in px

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function CurveGraph({
  points,
  color,
  onMove,
}: {
  points: CurvePoint[];
  color: string;
  onMove: (index: number, p: CurvePoint) => void;
}) {
  const [dragging, setDragging] = useState<number | null>(null);

  // Build SVG-like path string for the curve
  const pathPoints = points.map((p) => ({
    px: (p.x / 255) * GRAPH,
    py: GRAPH - (p.y / 255) * GRAPH,
  }));

  // Catmull-Rom spline through points
  const curvePath = pathPoints.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.px} ${pt.py}`;
    const prev = pathPoints[i - 1];
    const cp1x = prev.px + (pt.px - prev.px) / 3;
    const cp1y = prev.py;
    const cp2x = pt.px - (pt.px - prev.px) / 3;
    const cp2y = pt.py;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.px} ${pt.py}`;
  }, '');

  const makeResponder = (index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => setDragging(index),
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const x = Math.round(Math.min(Math.max(locationX / GRAPH * 255, 0), 255));
        const y = Math.round(Math.min(Math.max((1 - locationY / GRAPH) * 255, 0), 255));
        onMove(index, { x, y });
      },
      onPanResponderRelease: () => setDragging(null),
    });

  return (
    <View style={[styles.graph, { width: GRAPH, height: GRAPH }]}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <React.Fragment key={t}>
          <View style={[styles.gridH, { top: t * GRAPH }]} />
          <View style={[styles.gridV, { left: t * GRAPH }]} />
        </React.Fragment>
      ))}

      {/* Diagonal baseline */}
      <View style={styles.baseline} />

      {/* Curve line — drawn as connected segments */}
      {pathPoints.slice(1).map((pt, i) => {
        const prev = pathPoints[i];
        const dx = pt.px - prev.px;
        const dy = pt.py - prev.py;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: (prev.px + pt.px) / 2 - len / 2,
              top:  (prev.py + pt.py) / 2 - 1.5,
              width: len,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: color,
              opacity: 0.9,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Control points */}
      {pathPoints.map((pt, i) => {
        const responder = makeResponder(i);
        return (
          <View
            key={i}
            {...responder.panHandlers}
            style={[
              styles.controlPoint,
              {
                left: pt.px - 8,
                top:  pt.py - 8,
                borderColor: color,
                backgroundColor: dragging === i ? color : PF.bgCard,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export function CurvesPanel() {
  const curves       = useEditorStore((s) => s.curves);
  const setCurvePoint = useEditorStore((s) => s.setCurvePoint);
  const resetCurves  = useEditorStore((s) => s.resetCurves);
  const [activeChannel, setActiveChannel] = useState<Channel>('rgb');

  const activeColor = CHANNELS.find((c) => c.id === activeChannel)?.color ?? '#fff';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>TONE CURVE</Text>
        <Pressable onPress={resetCurves} hitSlop={10}>
          <Text style={styles.resetBtn}>Reset</Text>
        </Pressable>
      </View>

      {/* Channel selector */}
      <View style={styles.channelRow}>
        {CHANNELS.map((ch) => (
          <Pressable
            key={ch.id}
            onPress={() => setActiveChannel(ch.id)}
            style={[
              styles.channelBtn,
              activeChannel === ch.id && { backgroundColor: ch.color + '22', borderColor: ch.color + '66' },
            ]}>
            <Text style={[styles.channelLabel, { color: activeChannel === ch.id ? ch.color : PF.textMuted }]}>
              {ch.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Curve graph */}
      <View style={styles.graphWrap}>
        <CurveGraph
          points={curves[activeChannel]}
          color={activeColor}
          onMove={(index, point) => setCurvePoint(activeChannel, index, point)}
        />
      </View>

      {/* Point values */}
      <View style={styles.pointsRow}>
        {['Blacks', 'Shadows', 'Mids', 'Highlights', 'Whites'].map((label, i) => {
          const pt = curves[activeChannel][i];
          const delta = pt.y - pt.x;
          return (
            <View key={label} style={styles.pointInfo}>
              <Text style={styles.pointLabel}>{label}</Text>
              <Text style={[styles.pointVal, { color: delta !== 0 ? activeColor : PF.textMuted }]}>
                {delta > 0 ? `+${delta}` : delta}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.tip}>
        <Text style={styles.tipText}>Drag the points to adjust the tone curve</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 14, alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  heading:  { fontSize: 11, fontWeight: '700', color: PF.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  resetBtn: { fontSize: 12, fontWeight: '600', color: PF.accent },

  channelRow: { flexDirection: 'row', gap: 8, width: '100%' },
  channelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 7,
    borderRadius: 10, backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border,
  },
  channelLabel: { fontSize: 12, fontWeight: '600' },

  graphWrap: {
    backgroundColor: PF.bgElevated,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: PF.border,
  },
  graph: { position: 'relative', overflow: 'hidden' },

  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: PF.border },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: PF.border },
  baseline: {
    position: 'absolute', left: 0, top: 0,
    width: GRAPH * 1.42, height: 1,
    backgroundColor: PF.textMuted,
    opacity: 0.4,
    transform: [{ rotate: '-45deg' }, { translateX: -GRAPH * 0.21 }, { translateY: GRAPH * 0.5 }],
  },
  controlPoint: {
    position: 'absolute',
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2,
    zIndex: 10,
  },

  pointsRow: { flexDirection: 'row', width: '100%', gap: 4 },
  pointInfo: { flex: 1, alignItems: 'center', gap: 2 },
  pointLabel: { fontSize: 9, fontWeight: '500', color: PF.textMuted },
  pointVal:   { fontSize: 11, fontWeight: '700' },

  tip: { alignItems: 'center' },
  tipText: { fontSize: 10, fontWeight: '400', color: PF.textMuted },
});
