import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PFText } from '@/components/ui/pf-text';
import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';

interface FaceRow {
  key: 'faceSmoothing' | 'faceWhitening' | 'faceSlim';
  label: string;
  icon: string;
  description: string;
}

const FACE_ROWS: FaceRow[] = [
  { key: 'faceSmoothing', label: 'Skin Smoothing', icon: '✨', description: 'Reduce texture and blemishes' },
  { key: 'faceWhitening', label: 'Skin Whitening', icon: '💡', description: 'Brighten and even skin tone' },
  { key: 'faceSlim',      label: 'Face Slim',      icon: '💎', description: 'Subtle face reshaping' },
];

export function FacePanel() {
  const faceSmoothing = useEditorStore((s) => s.faceSmoothing);
  const faceWhitening = useEditorStore((s) => s.faceWhitening);
  const faceSlim      = useEditorStore((s) => s.faceSlim);
  const setFaceSmoothing = useEditorStore((s) => s.setFaceSmoothing);
  const setFaceWhitening = useEditorStore((s) => s.setFaceWhitening);
  const setFaceSlim      = useEditorStore((s) => s.setFaceSlim);

  const values  = { faceSmoothing, faceWhitening, faceSlim };
  const setters = { faceSmoothing: setFaceSmoothing, faceWhitening: setFaceWhitening, faceSlim: setFaceSlim };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      <View style={styles.notice}>
        <PFText style={styles.noticeIcon}>💆</PFText>
        <PFText variant="caption" color={PF.textSecondary} style={styles.noticeText}>
          Local face sliders apply subtle enhancements. For AI-powered retouching, use the AI tab.
        </PFText>
      </View>

      {FACE_ROWS.map((row) => {
        const val = values[row.key];
        return (
          <View key={row.key} style={styles.row}>
            <View style={styles.rowHeader}>
              <PFText style={styles.icon}>{row.icon}</PFText>
              <View style={styles.rowInfo}>
                <PFText variant="caption" bold color={PF.textPrimary}>{row.label}</PFText>
                <PFText variant="micro" color={PF.textMuted}>{row.description}</PFText>
              </View>
              <PFText variant="caption" color={val > 0 ? PF.accent : PF.textMuted} style={styles.value}>
                {Math.round(val * 100)}%
              </PFText>
            </View>
            <Slider value={val} min={0} max={1} onChange={setters[row.key]} accentColor={PF.accent} />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 16,
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: PF.bgElevated,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeIcon: { fontSize: 18 },
  noticeText: { flex: 1 },
  row: { gap: 8 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 18, width: 26 },
  rowInfo: { flex: 1, gap: 1 },
  value: { minWidth: 36, textAlign: 'right' },
});
