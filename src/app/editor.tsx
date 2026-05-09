import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PFText } from '@/components/ui/pf-text';
import { ProcessingOverlay } from '@/components/ui/processing-overlay';
import { PF } from '@/constants/colors';
import { AdjustPanel } from '@/features/editor/adjust-panel';
import { CropPanel } from '@/features/editor/crop-panel';
import { CurvesPanel } from '@/features/editor/curves-panel';
import { DrawPanel } from '@/features/editor/draw-panel';
import { EditorCanvas, EditorCanvasRef } from '@/features/editor/editor-canvas';
import { EditorToolbar } from '@/features/editor/editor-toolbar';
import { EffectsPanel } from '@/features/editor/effects-panel';
import { ExportSheet } from '@/features/editor/export-sheet';
import { FilterPanel } from '@/features/editor/filter-panel';
import { GradingPanel } from '@/features/editor/grading-panel';
import { HslPanel } from '@/features/editor/hsl-panel';
import { ShapesPanel } from '@/features/editor/shapes-panel';
import { StickerPanel } from '@/features/editor/sticker-panel';
import { EditStyleSheet } from '@/features/editor/style-sheet';
import { TextPanel } from '@/features/editor/text-panel';
import { TransformPanel } from '@/features/editor/transform-panel';
import { useEditorStore } from '@/store/editor-store';

const PANEL_HEIGHT = 268;

export default function EditorScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const canvasRef = useRef<EditorCanvasRef>(null);

  const activeTab       = useEditorStore((s) => s.activeTab);
  const isProcessing    = useEditorStore((s) => s.isProcessing);
  const processingLabel = useEditorStore((s) => s.processingLabel);
  const canUndo         = useEditorStore((s) => s.canUndo);
  const canRedo         = useEditorStore((s) => s.canRedo);
  const editedUri       = useEditorStore((s) => s.editedUri);
  const undo            = useEditorStore((s) => s.undo);
  const redo            = useEditorStore((s) => s.redo);

  const [exportVisible, setExportVisible] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [styleVisible,  setStyleVisible]  = useState(false);

  const goHome = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const handleBack = useCallback(() => {
    if (editedUri) {
      Alert.alert('Discard changes?', 'Your unsaved edits will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: goHome },
      ]);
    } else {
      goHome();
    }
  }, [editedUri, goHome]);

  const captureCanvas = useCallback(async (): Promise<string> => {
    if (!canvasRef.current) throw new Error('Canvas not ready');
    return canvasRef.current.captureAsync();
  }, []);

  const renderPanel = () => {
    if (showTransform) return <TransformPanel />;
    switch (activeTab) {
      case 'adjust':   return <AdjustPanel />;
      case 'curves':   return <CurvesPanel />;
      case 'hsl':      return <HslPanel />;
      case 'grading':  return <GradingPanel />;
      case 'filters':  return <FilterPanel />;
      case 'effects':  return <EffectsPanel />;
      case 'crop':     return <CropPanel />;
      case 'shapes':   return <ShapesPanel />;
      case 'draw':     return <DrawPanel />;
      case 'text':     return <TextPanel />;
      case 'stickers': return <StickerPanel />;
      default:         return <AdjustPanel />;
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <PFText style={styles.backArrow}>‹</PFText>
        </Pressable>

        <PFText style={styles.topTitle}>Kayu</PFText>

        <View style={styles.topRight}>
          {/* Undo */}
          <Pressable
            onPress={undo}
            disabled={!canUndo}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              !canUndo && styles.iconBtnDisabled,
              pressed && styles.pressed,
            ]}>
            <PFText style={styles.iconBtnText}>↩</PFText>
          </Pressable>

          {/* Redo */}
          <Pressable
            onPress={redo}
            disabled={!canRedo}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              !canRedo && styles.iconBtnDisabled,
              pressed && styles.pressed,
            ]}>
            <PFText style={styles.iconBtnText}>↪</PFText>
          </Pressable>

          {/* Transform */}
          <Pressable
            onPress={() => setShowTransform((v) => !v)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              showTransform && styles.iconBtnActive,
              pressed && styles.pressed,
            ]}>
            <PFText style={styles.iconBtnText}>⟳</PFText>
          </Pressable>

          {/* Copy / Paste style */}
          <Pressable
            onPress={() => setStyleVisible(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <PFText style={styles.iconBtnText}>✦</PFText>
          </Pressable>

          {/* Save / Export */}
          <Pressable
            onPress={() => setExportVisible(true)}
            style={({ pressed }) => [styles.exportPill, pressed && styles.pressed]}>
            <PFText style={styles.exportLabel}>Save</PFText>
          </Pressable>
        </View>
      </View>

      {/* ── Canvas ── */}
      <EditorCanvas ref={canvasRef} style={styles.canvas} />

      {/* ── Tool tabs ── */}
      <EditorToolbar />

      {/* ── Bottom panel ── */}
      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {renderPanel()}
      </View>

      {/* ── Overlays ── */}
      <ProcessingOverlay visible={isProcessing} label={processingLabel} />

      <ExportSheet
        visible={exportVisible}
        onClose={() => setExportVisible(false)}
        captureCanvas={captureCanvas}
      />

      <EditStyleSheet
        visible={styleVisible}
        onClose={() => setStyleVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PF.bg },

  topBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PF.border,
  },
  topTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: PF.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  topRight:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: PF.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: PF.border,
  },
  iconBtnText:     { fontSize: 17, color: PF.textPrimary },
  iconBtnDisabled: { opacity: 0.28 },
  iconBtnActive:   { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  backArrow:       { fontSize: 24, color: PF.textPrimary, lineHeight: 28 },

  exportPill: {
    backgroundColor: PF.accent,
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20,
    shadowColor: PF.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  exportLabel: { fontSize: 13, fontWeight: '700', color: PF.white, letterSpacing: 0.2 },

  pressed: { opacity: 0.65 },
  canvas:  { flex: 1 },
  panel: {
    height: PANEL_HEIGHT,
    backgroundColor: PF.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PF.border,
  },
});
