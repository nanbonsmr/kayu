import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { PFButton } from '@/components/ui/pf-button';
import { PFText } from '@/components/ui/pf-text';
import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { PaywallScreen } from '@/features/subscription/paywall-screen';
import { useEditorStore } from '@/store/editor-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { TextLayer } from '@/types/editor';
import { uid } from '@/utils/id';

// Free fonts
const FREE_FONTS = ['System', 'serif', 'monospace', 'Georgia', 'Helvetica', 'Courier'];

// Premium fonts (Pro only)
const PRO_FONTS = [
  'Palatino',
  'Baskerville',
  'Didot',
  'Futura',
  'Gill Sans',
  'Optima',
  'Rockwell',
  'American Typewriter',
  'Chalkboard SE',
  'Marker Felt',
  'Noteworthy',
  'Papyrus',
  'Copperplate',
  'Zapfino',
  'Bradley Hand',
  'Snell Roundhand',
  'Hoefler Text',
  'Avenir',
  'Avenir Next',
  'Helvetica Neue',
];

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#F87171', '#FBBF24',
  '#34D399', '#60A5FA', '#A78BFA', '#F472B6',
  '#FB923C', '#6EE7B7', '#FDE68A', '#C4B5FD',
];

export function TextPanel() {
  const textLayers      = useEditorStore((s) => s.textLayers);
  const addTextLayer    = useEditorStore((s) => s.addTextLayer);
  const updateTextLayer = useEditorStore((s) => s.updateTextLayer);
  const removeTextLayer = useEditorStore((s) => s.removeTextLayer);
  const isPro           = useSubscriptionStore((s) => s.isActive);

  const [modalVisible, setModalVisible]   = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const [text, setText]             = useState('');
  const [fontSize, setFontSize]     = useState(32);
  const [fontFamily, setFontFamily] = useState('System');
  const [color, setColor]           = useState('#FFFFFF');
  const [bold, setBold]             = useState(false);
  const [italic, setItalic]         = useState(false);

  const openNew = () => {
    setText(''); setFontSize(32); setFontFamily('System');
    setColor('#FFFFFF'); setBold(false); setItalic(false);
    setEditingId(null);
    setModalVisible(true);
  };

  const openEdit = (layer: TextLayer) => {
    setText(layer.text); setFontSize(layer.fontSize);
    setFontFamily(layer.fontFamily); setColor(layer.color);
    setBold(layer.bold); setItalic(layer.italic);
    setEditingId(layer.id);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!text.trim()) return;
    if (editingId) {
      updateTextLayer(editingId, { text, fontSize, fontFamily, color, bold, italic });
    } else {
      const layer: TextLayer = {
        id: uid(), text,
        x: 60, y: 80,
        fontSize, fontFamily, color, bold, italic,
        rotation: 0,
      };
      addTextLayer(layer);
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <PFText variant="label" color={PF.textSecondary}>TEXT LAYERS</PFText>
        <TouchableOpacity onPress={openNew} style={styles.addBtn} hitSlop={6}>
          <PFText variant="label" color={PF.accent}>+ Add Text</PFText>
        </TouchableOpacity>
      </View>

      {/* Layer list */}
      <ScrollView style={styles.layerList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {textLayers.length === 0 && (
          <PFText variant="caption" color={PF.textMuted} center style={styles.empty}>
            No text layers yet. Tap "+ Add Text" to start.
          </PFText>
        )}
        {textLayers.map((layer) => (
          <View key={layer.id} style={styles.layerRow}>
            <TouchableOpacity style={styles.layerInfo} onPress={() => openEdit(layer)}>
              <PFText
                variant="body"
                color={layer.color}
                style={{
                  fontFamily: layer.fontFamily,
                  fontWeight: layer.bold ? '700' : '400',
                  fontStyle: layer.italic ? 'italic' : 'normal',
                }}
                numberOfLines={1}>
                {layer.text}
              </PFText>
              <PFText variant="micro" color={PF.textMuted}>
                {layer.fontFamily} · {layer.fontSize}px
              </PFText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeTextLayer(layer.id)} style={styles.deleteBtn} hitSlop={8}>
              <PFText style={styles.deleteIcon}>🗑️</PFText>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Drag tip */}
      {textLayers.length > 0 && (
        <View style={styles.tip}>
          <PFText style={styles.tipText}>Drag text on the photo to move it · Tap to select · ✕ to delete</PFText>
        </View>
      )}

      {/* ── Text editor modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalCard}>
            {/* Drag handle */}
            <View style={styles.handle} />

            <PFText variant="subtitle" bold color={PF.textPrimary} style={styles.modalTitle}>
              {editingId ? 'Edit Text' : 'Add Text'}
            </PFText>

            {/* Scrollable form */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              {/* Text input */}
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type something..."
                placeholderTextColor={PF.textMuted}
                style={[
                  styles.textInput,
                  {
                    color,
                    fontFamily,
                    fontWeight: bold ? '700' : '400',
                    fontStyle: italic ? 'italic' : 'normal',
                    fontSize: Math.min(fontSize, 26),
                  },
                ]}
                multiline
                autoFocus
              />

              {/* Font size */}
              <View style={styles.sliderBlock}>
                <View style={styles.sliderRow}>
                  <PFText variant="caption" color={PF.textSecondary} style={styles.sliderLabel}>Size</PFText>
                  <View style={styles.sliderWrap}>
                    <Slider value={fontSize} min={12} max={120} onChange={setFontSize} accentColor={PF.accent} />
                  </View>
                  <PFText variant="caption" color={PF.accent} style={styles.sliderVal}>{Math.round(fontSize)}</PFText>
                </View>
              </View>

              {/* Color picker */}
              <View>
                <PFText variant="micro" color={PF.textMuted} style={styles.rowLabel}>COLOR</PFText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
                  {TEXT_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColor(c)}
                      style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Font family */}
              <View>
                <PFText variant="micro" color={PF.textMuted} style={styles.rowLabel}>FONT</PFText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontRow}>
                  {FREE_FONTS.map((f) => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setFontFamily(f)}
                      style={[styles.fontChip, fontFamily === f && styles.fontChipActive]}>
                      <PFText variant="caption" color={fontFamily === f ? PF.accent : PF.textSecondary} style={{ fontFamily: f }}>
                        {f}
                      </PFText>
                    </TouchableOpacity>
                  ))}
                  {/* Pro fonts */}
                  {PRO_FONTS.map((f) => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => {
                        if (!isPro) { setPaywallVisible(true); return; }
                        setFontFamily(f);
                      }}
                      style={[styles.fontChip, fontFamily === f && styles.fontChipActive, !isPro && styles.fontChipLocked]}>
                      <PFText variant="caption" color={fontFamily === f ? PF.accent : PF.textSecondary} style={{ fontFamily: f }}>
                        {f}
                      </PFText>
                      {!isPro && (
                        <View style={styles.fontLockBadge}>
                          <Text style={styles.fontLockTxt}>PRO</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Style toggles */}
              <View style={styles.styleRow}>
                <TouchableOpacity
                  onPress={() => setBold(!bold)}
                  style={[styles.styleBtn, bold && styles.styleBtnActive]}>
                  <PFText variant="body" bold color={bold ? PF.accent : PF.textSecondary}>B</PFText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setItalic(!italic)}
                  style={[styles.styleBtn, italic && styles.styleBtnActive]}>
                  <PFText variant="body" color={italic ? PF.accent : PF.textSecondary} style={{ fontStyle: 'italic' }}>I</PFText>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Action buttons — always visible above keyboard */}
            <View style={styles.modalActions}>
              <PFButton label="Cancel" onPress={() => setModalVisible(false)} variant="secondary" style={styles.modalBtn} />
              <PFButton label={editingId ? 'Update' : 'Add'} onPress={handleSave} variant="primary" style={styles.modalBtn} disabled={!text.trim()} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PaywallScreen
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        featureName="Premium Fonts"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: PF.accentDim,
    borderRadius: 8,
  },
  layerList: { flex: 1 },
  empty: { marginTop: 30 },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PF.bgElevated,
    borderRadius: 10,
    padding: 10,
    marginBottom: 7,
    gap: 10,
  },
  layerInfo: { flex: 1, gap: 2 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16 },

  tip: {
    alignItems: 'center', paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: PF.border,
  },
  tipText: { fontSize: 10, fontWeight: '500', color: PF.textMuted },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PF.overlay,
  },
  modalCard: {
    backgroundColor: PF.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: PF.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: { marginBottom: 12 },

  formScroll: { flexShrink: 1 },
  formContent: { gap: 14, paddingBottom: 8 },

  textInput: {
    backgroundColor: PF.bgInput,
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    borderWidth: 1,
    borderColor: PF.border,
    textAlignVertical: 'top',
  },

  sliderBlock: {
    backgroundColor: PF.bgElevated,
    borderRadius: 12,
    padding: 12,
  },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { width: 40 },
  sliderWrap: { flex: 1 },
  sliderVal: { width: 32, textAlign: 'right' },

  rowLabel: { marginBottom: 6 },
  colorRow: { gap: 8, paddingVertical: 2 },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: { borderColor: PF.white, transform: [{ scale: 1.15 }] },

  fontRow: { gap: 7, paddingVertical: 2 },
  fontChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: PF.bgElevated,
    borderRadius: 8,
  },
  fontChipActive: {
    backgroundColor: PF.accentDim,
    borderWidth: 1,
    borderColor: PF.borderActive,
  },
  fontChipLocked: { opacity: 0.7 },
  fontLockBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#F5C842',
    paddingHorizontal: 3, paddingVertical: 1,
    borderRadius: 4,
  },
  fontLockTxt: { fontSize: 6, fontWeight: '800', color: '#000' },

  styleRow: { flexDirection: 'row', gap: 8 },
  styleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: PF.bgElevated,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleBtnActive: {
    backgroundColor: PF.accentDim,
    borderWidth: 1,
    borderColor: PF.borderActive,
  },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalBtn: { flex: 1 },
});
