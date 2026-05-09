import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PFText } from '@/components/ui/pf-text';
import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';
import { ExportFormat } from '@/types/editor';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Captures the canvas and returns a temp file URI */
  captureCanvas: () => Promise<string>;
  onExported?: (uri: string) => void;
}

const FORMATS: { id: ExportFormat; label: string; icon: string; desc: string }[] = [
  { id: 'jpeg', label: 'JPEG', icon: '📷', desc: 'Smaller · great for photos' },
  { id: 'png',  label: 'PNG',  icon: '🖼️', desc: 'Lossless · transparency'   },
  { id: 'webp', label: 'WebP', icon: '🌐', desc: 'Modern · best compression'  },
];

export function ExportSheet({ visible, onClose, captureCanvas, onExported }: Props) {
  const setProcessing = useEditorStore((s) => s.setProcessing);
  const editedUri     = useEditorStore((s) => s.editedUri);

  const [format,        setFormat]        = useState<ExportFormat>('jpeg');
  const [quality,       setQuality]       = useState(0.92);
  const [saveToGallery, setSaveToGallery] = useState(true);
  const [share,         setShare]         = useState(false);
  const [loading,       setLoading]       = useState(false);

  const handleExport = async () => {
    if (!editedUri) return;
    setLoading(true);
    setProcessing(true, 'Capturing edits…');

    try {
      // 1. Capture the canvas — this bakes image + filters + draw + text + stickers
      const capturedUri = await captureCanvas();

      setProcessing(true, 'Saving…');

      // 2. Save to gallery
      if (saveToGallery) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(capturedUri);
        } else {
          Alert.alert('Permission denied', 'Gallery permission is required to save.');
        }
      }

      // 3. Share
      if (share) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(capturedUri, {
            mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
            dialogTitle: 'Share your Kayu creation',
          });
        }
      }

      onExported?.(capturedUri);

      Alert.alert(
        '✅ Saved!',
        saveToGallery ? 'Your edited photo has been saved to your gallery.' : 'Export complete.',
        [{ text: 'Done', onPress: onClose }]
      );
    } catch (e: unknown) {
      Alert.alert('Export Error', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            <PFText style={styles.title}>Save Photo</PFText>
            <PFText style={styles.subtitle}>
              All edits — filters, adjustments, drawing and text — will be baked into the saved image.
            </PFText>

            {/* Format */}
            <PFText style={styles.sectionLabel}>FORMAT</PFText>
            <View style={styles.formatRow}>
              {FORMATS.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => setFormat(f.id)}
                  style={({ pressed }) => [
                    styles.formatCard,
                    format === f.id && styles.formatCardActive,
                    pressed && styles.pressed,
                  ]}>
                  <PFText style={styles.formatIcon}>{f.icon}</PFText>
                  <PFText style={[styles.formatLabel, format === f.id && styles.formatLabelActive]}>
                    {f.label}
                  </PFText>
                  <PFText style={styles.formatDesc}>{f.desc}</PFText>
                </Pressable>
              ))}
            </View>

            {/* Quality */}
            {format !== 'png' && (
              <View style={styles.qualityBlock}>
                <View style={styles.qualityHeader}>
                  <PFText style={styles.sectionLabel}>QUALITY</PFText>
                  <PFText style={styles.qualityVal}>{Math.round(quality * 100)}%</PFText>
                </View>
                <Slider
                  value={quality}
                  min={0.1}
                  max={1}
                  onChange={setQuality}
                  accentColor={PF.accent}
                />
              </View>
            )}

            {/* Options */}
            <PFText style={styles.sectionLabel}>OPTIONS</PFText>
            <View style={styles.optionRow}>
              <Pressable
                onPress={() => setSaveToGallery(!saveToGallery)}
                style={({ pressed }) => [
                  styles.optionChip,
                  saveToGallery && styles.optionChipActive,
                  pressed && styles.pressed,
                ]}>
                <PFText style={styles.optionIcon}>📁</PFText>
                <PFText style={[styles.optionLabel, saveToGallery && styles.optionLabelActive]}>
                  Save to Gallery
                </PFText>
              </Pressable>
              <Pressable
                onPress={() => setShare(!share)}
                style={({ pressed }) => [
                  styles.optionChip,
                  share && styles.optionChipActive,
                  pressed && styles.pressed,
                ]}>
                <PFText style={styles.optionIcon}>📤</PFText>
                <PFText style={[styles.optionLabel, share && styles.optionLabelActive]}>
                  Share
                </PFText>
              </Pressable>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={[styles.actions, { paddingBottom: Platform.OS === 'ios' ? 30 : 16 }]}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}>
              <PFText style={styles.cancelLabel}>Cancel</PFText>
            </Pressable>
            <Pressable
              onPress={handleExport}
              disabled={loading || !editedUri}
              style={({ pressed }) => [
                styles.saveBtn,
                (loading || !editedUri) && styles.saveBtnDisabled,
                pressed && styles.pressed,
              ]}>
              <PFText style={styles.saveLabel}>
                {loading ? 'Saving…' : '💾  Save Photo'}
              </PFText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: PF.overlay },
  sheet: {
    backgroundColor: PF.bgSheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: PF.borderLight,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  scroll:  { flexShrink: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 14 },

  title:    { fontSize: 20, fontWeight: '700', color: PF.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '400', color: PF.textSecondary, lineHeight: 18 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: PF.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  formatRow: { flexDirection: 'row', gap: 8 },
  formatCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: PF.bgElevated, borderRadius: 14,
    padding: 12, gap: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: PF.border,
  },
  formatCardActive:  { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  formatIcon:        { fontSize: 22 },
  formatLabel:       { fontSize: 13, fontWeight: '700', color: PF.textPrimary },
  formatLabelActive: { color: PF.accent },
  formatDesc:        { fontSize: 9, color: PF.textMuted, textAlign: 'center' },

  qualityBlock:  { backgroundColor: PF.bgElevated, borderRadius: 14, padding: 14, gap: 12 },
  qualityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qualityVal:    { fontSize: 13, fontWeight: '700', color: PF.accent },

  optionRow: { flexDirection: 'row', gap: 10 },
  optionChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: PF.bgElevated, borderRadius: 12, padding: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: PF.border,
  },
  optionChipActive:  { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  optionIcon:        { fontSize: 16 },
  optionLabel:       { fontSize: 13, fontWeight: '500', color: PF.textSecondary },
  optionLabelActive: { color: PF.accent, fontWeight: '600' },

  actions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: PF.border,
  },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, backgroundColor: PF.bgElevated,
    borderWidth: StyleSheet.hairlineWidth, borderColor: PF.border,
  },
  cancelLabel: { fontSize: 15, fontWeight: '600', color: PF.textSecondary },
  saveBtn: {
    flex: 2, alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, backgroundColor: PF.accent,
    shadowColor: PF.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  saveLabel:       { fontSize: 15, fontWeight: '700', color: PF.white },
  pressed:         { opacity: 0.65 },
});
