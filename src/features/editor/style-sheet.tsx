import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';
import { useStyleStore } from '@/store/style-store';
import { EditStyle, STYLE_SECTIONS, StyleSection } from '@/types/edit-style';
import {
    DEFAULT_ADJUSTMENTS,
    DEFAULT_COLOR_GRADING,
    DEFAULT_CURVES,
    DEFAULT_HSL,
} from '@/types/editor';
import { timeAgo } from '@/utils/format';
import { uid } from '@/utils/id';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props { visible: boolean; onClose: () => void }
type Tab = 'copy' | 'paste' | 'presets' | 'import';

// ─── Lightroom XMP parser ─────────────────────────────────────────────────────
function parseLightroomXmp(xmp: string): Partial<EditStyle['adjustments']> {
  const get = (tag: string): number => {
    const m = xmp.match(new RegExp(`crs:${tag}="([^"]+)"`));
    return m ? parseFloat(m[1]) || 0 : 0;
  };
  const lr    = (v: number) => Math.max(-1, Math.min(1, v / 100));
  const lrExp = (v: number) => Math.max(-1, Math.min(1, v / 5));
  return {
    brightness:  lr(get('Brightness')),
    contrast:    lr(get('Contrast')),
    saturation:  lr(get('Saturation')),
    exposure:    lrExp(get('Exposure2012') || get('Exposure')),
    highlights:  lr(get('Highlights2012') || get('HighlightRecovery')),
    shadows:     lr(get('Shadows2012')    || get('Shadows')),
    temperature: lr((get('Temperature') - 5500) / 50),
    tint:        lr(get('Tint')),
    sharpness:   Math.max(0, Math.min(1, get('Sharpness') / 150)),
    blur:        0,
    vignette:    Math.max(0, Math.min(1, -get('VignetteAmount') / 100)),
    fade:        0,
    grain:       Math.max(0, Math.min(1, get('GrainAmount') / 100)),
  };
}

// ─── Generic JSON normaliser ──────────────────────────────────────────────────
function parseGenericJson(obj: Record<string, unknown>): Partial<EditStyle['adjustments']> {
  const n = (key: string, scale = 100): number => {
    const v = obj[key];
    return typeof v === 'number' ? Math.max(-1, Math.min(1, v / scale)) : 0;
  };
  return {
    brightness:  n('brightness') || n('exposure', 5),
    contrast:    n('contrast'),
    saturation:  n('saturation') || n('vibrance'),
    exposure:    n('exposure', 5),
    highlights:  n('highlights'),
    shadows:     n('shadows'),
    temperature: n('temperature', 50) || n('warmth'),
    tint:        n('tint'),
    sharpness:   Math.max(0, n('sharpness') || n('clarity', 100)),
    blur:        0,
    vignette:    Math.max(0, -(n('vignette') || n('vignetteAmount'))),
    fade:        Math.max(0, n('fade') || n('matte', 100)),
    grain:       Math.max(0, n('grain') || n('filmGrain', 100)),
  };
}

// ─── Build a full EditStyle from partial adjustments ─────────────────────────

function buildStyleFromAdj(
  adj: Partial<EditStyle['adjustments']>,
  name: string,
  source: string
): EditStyle {
  return {
    id: uid(), name, description: `Imported from ${source}`,
    createdAt: Date.now(), updatedAt: Date.now(),
    source, version: '1.0',
    include: { adjustments: true, curves: false, hsl: false, colorGrading: false, filter: false },
    adjustments: { ...DEFAULT_ADJUSTMENTS, ...adj },
    curves: DEFAULT_CURVES,
    hsl: DEFAULT_HSL,
    colorGrading: DEFAULT_COLOR_GRADING,
    activeFilterId: null,
    filterIntensity: 1,
  };
}

// ─── Empty state helper ───────────────────────────────────────────────────────
function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <View style={S.emptyState}>
      <Text style={S.emptyIcon}>{icon}</Text>
      <Text style={S.emptyTitle}>{title}</Text>
      <Text style={S.emptyText}>{text}</Text>
    </View>
  );
}

// ─── Style card ───────────────────────────────────────────────────────────────
function StyleCard({
  style, onApply, onExport, onDelete, onClear, showClear,
}: {
  style: EditStyle;
  onApply: () => void;
  onExport: () => void;
  onDelete?: () => void;
  onClear?: () => void;
  showClear?: boolean;
}) {
  const included = STYLE_SECTIONS.filter((s) => style.include[s.key]);
  const srcLabel =
    style.source === 'kayu' ? '✦ Kayu' :
    style.source === 'lightroom'  ? '🔵 Lightroom'  :
    `↗ ${style.source}`;

  return (
    <View style={C.card}>
      <Text style={C.name}>{style.name}</Text>
      {!!style.description && <Text style={C.desc}>{style.description}</Text>}
      <Text style={C.meta}>{srcLabel}{'  ·  '}{timeAgo(style.updatedAt)}</Text>
      <View style={C.pills}>
        {included.map((s) => (
          <View key={s.key} style={C.pill}>
            <Text style={C.pillIcon}>{s.icon}</Text>
            <Text style={C.pillLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      <View style={C.actions}>
        <Pressable onPress={onApply} style={C.applyBtn}>
          <Text style={C.applyTxt}>📌  Apply</Text>
        </Pressable>
        <Pressable onPress={onExport} style={C.iconBtn}>
          <Text style={C.iconBtnTxt}>📤</Text>
        </Pressable>
        {onDelete && (
          <Pressable onPress={onDelete} style={C.delBtn}>
            <Text style={C.delTxt}>🗑️</Text>
          </Pressable>
        )}
        {showClear && onClear && (
          <Pressable onPress={onClear} style={C.delBtn}>
            <Text style={C.delTxt}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function EditStyleSheet({ visible, onClose }: Props) {
  const [tab, setTab]           = useState<Tab>('copy');
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [importText, setImportText]     = useState('');

  const [include, setInclude] = useState<Record<StyleSection, boolean>>({
    adjustments: true, curves: true, hsl: true, colorGrading: true, filter: true,
  });

  // Style store
  const clipboard       = useStyleStore((s) => s.clipboard);
  const presets         = useStyleStore((s) => s.presets);
  const copyToClipboard = useStyleStore((s) => s.copyToClipboard);
  const clearClipboard  = useStyleStore((s) => s.clearClipboard);
  const savePreset      = useStyleStore((s) => s.savePreset);
  const deletePreset    = useStyleStore((s) => s.deletePreset);
  const loadPresets     = useStyleStore((s) => s.loadPresets);
  const exportStyleJson = useStyleStore((s) => s.exportStyleJson);
  const importStyleJson = useStyleStore((s) => s.importStyleJson);

  // Editor state (read)
  const adjustments     = useEditorStore((s) => s.adjustments);
  const curves          = useEditorStore((s) => s.curves);
  const hsl             = useEditorStore((s) => s.hsl);
  const colorGrading    = useEditorStore((s) => s.colorGrading);
  const activeFilterId  = useEditorStore((s) => s.activeFilterId);
  const filterIntensity = useEditorStore((s) => s.filterIntensity);
  const saveSnapshot    = useEditorStore((s) => s.saveSnapshot);

  // Editor setters (write)
  const setAdjustment      = useEditorStore((s) => s.setAdjustment);
  const setCurvePoint      = useEditorStore((s) => s.setCurvePoint);
  const setHslChannel      = useEditorStore((s) => s.setHslChannel);
  const setGradingTone     = useEditorStore((s) => s.setGradingTone);
  const setGradingBlending = useEditorStore((s) => s.setGradingBlending);
  const setGradingBalance  = useEditorStore((s) => s.setGradingBalance);
  const setActiveFilter    = useEditorStore((s) => s.setActiveFilter);

  useEffect(() => { if (visible) loadPresets(); }, [visible]);

  // ── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    copyToClipboard({
      include,
      adjustments: { ...adjustments },
      curves, hsl, colorGrading, activeFilterId, filterIntensity,
    });
    Alert.alert('✅ Copied!', 'Style copied. Open another photo and tap Paste to apply it.');
  };

  // ── Apply a style ─────────────────────────────────────────────────────────
  const applyStyle = (style: EditStyle) => {
    if (style.include.adjustments) {
      (Object.keys(style.adjustments) as (keyof typeof style.adjustments)[])
        .forEach((k) => setAdjustment(k, style.adjustments[k]));
    }
    if (style.include.curves) {
      (['rgb', 'red', 'green', 'blue'] as const).forEach((ch) =>
        style.curves[ch].forEach((pt, i) => setCurvePoint(ch, i, pt))
      );
    }
    if (style.include.hsl) {
      (Object.keys(style.hsl) as (keyof typeof style.hsl)[])
        .forEach((c) => setHslChannel(c, style.hsl[c]));
    }
    if (style.include.colorGrading) {
      setGradingTone('shadows',    style.colorGrading.shadows);
      setGradingTone('midtones',   style.colorGrading.midtones);
      setGradingTone('highlights', style.colorGrading.highlights);
      setGradingBlending(style.colorGrading.blending);
      setGradingBalance(style.colorGrading.balance);
    }
    if (style.include.filter) {
      setActiveFilter(style.activeFilterId, style.filterIntensity);
    }
    saveSnapshot(`Paste style: ${style.name}`);
    Alert.alert('✅ Applied!', `"${style.name}" applied to this photo.`);
    onClose();
  };

  // ── Save preset ───────────────────────────────────────────────────────────
  const handleSavePreset = async () => {
    if (!saveName.trim()) return;
    const style: EditStyle = {
      id: uid(), name: saveName.trim(), description: saveDesc.trim(),
      createdAt: Date.now(), updatedAt: Date.now(),
      source: 'kayu', version: '1.0',
      include, adjustments: { ...adjustments }, curves, hsl, colorGrading,
      activeFilterId, filterIntensity,
    };
    await savePreset(style);
    setSaveName(''); setSaveDesc(''); setShowSaveForm(false);
    Alert.alert('✅ Saved!', `"${style.name}" saved to your presets.`);
  };

  // ── Export via Share sheet ────────────────────────────────────────────────
  const handleExport = async (style: EditStyle) => {
    try {
      const json = exportStyleJson(style);
      const path = `${FileSystem.cacheDirectory}pf_style_${style.id}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: `Share "${style.name}"` });
      } else {
        Alert.alert('Sharing not available', 'Cannot share on this device.');
      }
    } catch (e: unknown) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  // ── Import from pasted text ───────────────────────────────────────────────
  const handleImportText = async () => {
    const text = importText.trim();
    if (!text) { Alert.alert('Empty', 'Paste your style text first.'); return; }
    try {
      let style: EditStyle;
      if (text.startsWith('<') || text.includes('crs:')) {
        const adj = parseLightroomXmp(text);
        const m   = text.match(/crs:Name="([^"]+)"/);
        style = buildStyleFromAdj(adj, m ? m[1] : 'Lightroom Preset', 'lightroom');
      } else if (text.startsWith('{')) {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if ((parsed as { version?: string }).version === '1.0' && parsed.adjustments) {
          style = importStyleJson(text);
        } else {
          const adj  = parseGenericJson(parsed);
          const name = typeof parsed.name === 'string' ? parsed.name : 'Imported Style';
          style = buildStyleFromAdj(adj, name, 'external');
        }
      } else {
        Alert.alert('Unrecognised format', 'Paste a Kayu JSON or Lightroom XMP preset.');
        return;
      }
      await savePreset(style);
      setImportText('');
      Alert.alert('✅ Imported!', `"${style.name}" added to your presets.`);
      setTab('presets');
    } catch (e: unknown) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Could not parse the style.');
    }
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'copy',    label: 'Copy',    icon: '📋' },
    { id: 'paste',   label: 'Paste',   icon: '📌' },
    { id: 'presets', label: 'Presets', icon: '⭐' },
    { id: 'import',  label: 'Import',  icon: '📥' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={S.overlay}>
        <Pressable style={S.backdrop} onPress={onClose} />
        <View style={S.sheet}>
          <View style={S.handle} />
          <View style={S.header}>
            <Text style={S.title}>Edit Style</Text>
            <Text style={S.subtitle}>Copy · Paste · Save · Import from Lightroom & more</Text>
          </View>

          {/* Tab bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.tabRow} bounces={false}>
            {TABS.map((t) => (
              <Pressable key={t.id} onPress={() => setTab(t.id)}
                style={[S.tabBtn, tab === t.id && S.tabBtnActive]}>
                <Text style={S.tabIcon}>{t.icon}</Text>
                <Text style={[S.tabLabel, tab === t.id && S.tabLabelActive]}>{t.label}</Text>
                {t.id === 'paste' && clipboard && <View style={S.tabDot} />}
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView style={S.body} contentContainerStyle={S.bodyContent}
            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── COPY ── */}
            {tab === 'copy' && (
              <View style={S.section}>
                <Text style={S.sectionLabel}>SELECT WHAT TO COPY</Text>
                {STYLE_SECTIONS.map((s) => (
                  <Pressable key={s.key}
                    onPress={() => setInclude((p) => ({ ...p, [s.key]: !p[s.key] }))}
                    style={[S.checkRow, include[s.key] && S.checkRowActive]}>
                    <View style={[S.checkbox, include[s.key] && S.checkboxOn]}>
                      {include[s.key] && <Text style={S.checkmark}>✓</Text>}
                    </View>
                    <Text style={S.checkIcon}>{s.icon}</Text>
                    <Text style={[S.checkLabel, include[s.key] && S.checkLabelOn]}>{s.label}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={handleCopy} style={S.primaryBtn}>
                  <Text style={S.primaryBtnTxt}>📋  Copy Style to Clipboard</Text>
                </Pressable>
                <View style={S.divider} />
                {!showSaveForm ? (
                  <Pressable onPress={() => setShowSaveForm(true)} style={S.secondaryBtn}>
                    <Text style={S.secondaryBtnTxt}>⭐  Save as Named Preset</Text>
                  </Pressable>
                ) : (
                  <View style={S.saveForm}>
                    <Text style={S.sectionLabel}>PRESET NAME</Text>
                    <TextInput value={saveName} onChangeText={setSaveName}
                      placeholder="e.g. Moody Cinematic" placeholderTextColor={PF.textMuted}
                      style={S.input} autoFocus />
                    <TextInput value={saveDesc} onChangeText={setSaveDesc}
                      placeholder="Description (optional)" placeholderTextColor={PF.textMuted}
                      style={S.input} />
                    <View style={S.row}>
                      <Pressable onPress={() => setShowSaveForm(false)} style={S.cancelBtn}>
                        <Text style={S.cancelBtnTxt}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={handleSavePreset} disabled={!saveName.trim()}
                        style={[S.primaryBtn, S.flex2, !saveName.trim() && S.disabled]}>
                        <Text style={S.primaryBtnTxt}>Save</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ── PASTE ── */}
            {tab === 'paste' && (
              <View style={S.section}>
                {clipboard ? (
                  <>
                    <Text style={S.sectionLabel}>CLIPBOARD</Text>
                    <StyleCard style={clipboard} onApply={() => applyStyle(clipboard)}
                      onExport={() => handleExport(clipboard)} onClear={clearClipboard} showClear />
                  </>
                ) : (
                  <EmptyState icon="📋" title="Nothing copied yet"
                    text="Go to the Copy tab and copy your current edit style. Then open another photo and come back here to paste it." />
                )}
                {presets.length > 0 && (
                  <>
                    <View style={S.divider} />
                    <Text style={S.sectionLabel}>APPLY A PRESET</Text>
                    {presets.slice(0, 3).map((p) => (
                      <StyleCard key={p.id} style={p} onApply={() => applyStyle(p)}
                        onExport={() => handleExport(p)} />
                    ))}
                    {presets.length > 3 && (
                      <Pressable onPress={() => setTab('presets')} style={S.secondaryBtn}>
                        <Text style={S.secondaryBtnTxt}>View all {presets.length} presets →</Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            )}

            {/* ── PRESETS ── */}
            {tab === 'presets' && (
              <View style={S.section}>
                <Text style={S.sectionLabel}>SAVED PRESETS ({presets.length})</Text>
                {presets.length === 0 ? (
                  <EmptyState icon="⭐" title="No presets yet"
                    text="Save your current edits as a preset from the Copy tab, or import a Lightroom / VSCO style from the Import tab." />
                ) : (
                  presets.map((p) => (
                    <StyleCard key={p.id} style={p} onApply={() => applyStyle(p)}
                      onExport={() => handleExport(p)}
                      onDelete={() => Alert.alert('Delete', `Delete "${p.name}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deletePreset(p.id) },
                      ])} />
                  ))
                )}
              </View>
            )}

            {/* ── IMPORT ── */}
            {tab === 'import' && (
              <View style={S.section}>
                <Text style={S.sectionLabel}>SUPPORTED FORMATS</Text>
                <View style={S.formatGrid}>
                  {[
                    { icon: '🔵', name: 'Lightroom', fmt: 'XMP preset' },
                    { icon: '⚫', name: 'VSCO',       fmt: 'JSON export' },
                    { icon: '✦',  name: 'Kayu',       fmt: 'JSON style'  },
                    { icon: '📄', name: 'Any App',    fmt: 'Generic JSON' },
                  ].map((f) => (
                    <View key={f.name} style={S.formatCard}>
                      <Text style={S.formatIcon}>{f.icon}</Text>
                      <Text style={S.formatName}>{f.name}</Text>
                      <Text style={S.formatFmt}>{f.fmt}</Text>
                    </View>
                  ))}
                </View>

                <Text style={S.sectionLabel}>HOW TO IMPORT</Text>
                <View style={S.howToCard}>
                  {[
                    { n: '1', t: 'Lightroom: File → Export Preset → open .xmp in text editor → copy all' },
                    { n: '2', t: 'VSCO / other apps: export or copy the settings JSON' },
                    { n: '3', t: 'Paste the text below and tap Import' },
                  ].map((s) => (
                    <View key={s.n} style={S.howToRow}>
                      <View style={S.howToNum}><Text style={S.howToNumTxt}>{s.n}</Text></View>
                      <Text style={S.howToTxt}>{s.t}</Text>
                    </View>
                  ))}
                </View>

                <Text style={S.sectionLabel}>PASTE STYLE TEXT</Text>
                <TextInput value={importText} onChangeText={setImportText}
                  placeholder="Paste Lightroom XMP, VSCO JSON, or Kayu JSON here..."
                  placeholderTextColor={PF.textMuted}
                  style={S.importInput} multiline textAlignVertical="top" />
                <Pressable onPress={handleImportText} disabled={!importText.trim()}
                  style={[S.primaryBtn, !importText.trim() && S.disabled]}>
                  <Text style={S.primaryBtnTxt}>📥  Import Style</Text>
                </Pressable>

                <View style={S.divider} />
                <Text style={S.sectionLabel}>EXAMPLE — KAYU JSON</Text>
                <View style={S.exampleCard}>
                  <Text style={S.exampleCode}>{`{\n  "version": "1.0",\n  "name": "My Style",\n  "source": "kayu",\n  "adjustments": {\n    "brightness": 0.1,\n    "contrast": 0.2,\n    "saturation": -0.1,\n    "temperature": 0.15\n  }\n}`}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: PF.overlay },
  sheet: {
    backgroundColor: PF.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '92%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: PF.borderLight,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header:   { paddingHorizontal: 20, paddingBottom: 10, gap: 3 },
  title:    { fontSize: 20, fontWeight: '800', color: PF.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: PF.textSecondary },

  tabRow: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: PF.bgElevated, borderWidth: 1, borderColor: PF.border,
    position: 'relative',
  },
  tabBtnActive:   { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  tabIcon:        { fontSize: 13 },
  tabLabel:       { fontSize: 12, fontWeight: '600', color: PF.textMuted },
  tabLabelActive: { color: PF.accent },
  tabDot: {
    position: 'absolute', top: 4, right: 4,
    width: 7, height: 7, borderRadius: 4, backgroundColor: PF.success,
  },

  body:        { flexShrink: 1 },
  bodyContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 48, gap: 12 },
  section:     { gap: 10 },
  sectionLabel:{ fontSize: 10, fontWeight: '700', color: PF.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },

  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: PF.bgElevated, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: PF.border,
  },
  checkRowActive: { borderColor: PF.borderActive, backgroundColor: PF.accentDim },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: PF.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn:   { backgroundColor: PF.accent, borderColor: PF.accent },
  checkmark:    { fontSize: 12, color: '#fff', fontWeight: '800' },
  checkIcon:    { fontSize: 16 },
  checkLabel:   { flex: 1, fontSize: 13, fontWeight: '500', color: PF.textSecondary },
  checkLabelOn: { color: PF.textPrimary, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: PF.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    shadowColor: PF.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  primaryBtnTxt:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    backgroundColor: PF.bgElevated, borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1, borderColor: PF.border,
  },
  secondaryBtnTxt: { fontSize: 14, fontWeight: '600', color: PF.textSecondary },
  disabled:        { opacity: 0.38, shadowOpacity: 0 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: PF.border, marginVertical: 4 },
  row:     { flexDirection: 'row', gap: 10, alignItems: 'center' },
  flex2:   { flex: 2 },

  saveForm: { gap: 10 },
  input: {
    backgroundColor: PF.bgInput, borderRadius: 12, padding: 12,
    fontSize: 14, color: PF.textPrimary, borderWidth: 1, borderColor: PF.border,
  },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    backgroundColor: PF.bgElevated, borderWidth: 1, borderColor: PF.border,
  },
  cancelBtnTxt: { fontSize: 14, fontWeight: '600', color: PF.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyIcon:  { fontSize: 38 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: PF.textPrimary },
  emptyText:  { fontSize: 13, color: PF.textSecondary, textAlign: 'center', lineHeight: 19, maxWidth: 280 },

  formatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formatCard: {
    width: '47%', backgroundColor: PF.bgElevated, borderRadius: 12,
    padding: 12, gap: 4, borderWidth: 1, borderColor: PF.border, alignItems: 'center',
  },
  formatIcon: { fontSize: 22 },
  formatName: { fontSize: 13, fontWeight: '700', color: PF.textPrimary },
  formatFmt:  { fontSize: 10, color: PF.textMuted },

  howToCard: { backgroundColor: PF.bgElevated, borderRadius: 12, padding: 14, gap: 10 },
  howToRow:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  howToNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: PF.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  howToNumTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },
  howToTxt:    { flex: 1, fontSize: 12, color: PF.textSecondary, lineHeight: 18 },

  importInput: {
    backgroundColor: PF.bgInput, borderRadius: 12, padding: 12,
    fontSize: 12, color: PF.textPrimary, borderWidth: 1, borderColor: PF.border,
    minHeight: 120,
  },
  exampleCard: {
    backgroundColor: PF.bgElevated, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: PF.border,
  },
  exampleCode: { fontSize: 11, color: PF.textSecondary, lineHeight: 17 },
});

const C = StyleSheet.create({
  card: {
    backgroundColor: PF.bgElevated, borderRadius: 16, padding: 14, gap: 8,
    borderWidth: 1, borderColor: PF.border,
  },
  name:  { fontSize: 15, fontWeight: '700', color: PF.textPrimary },
  desc:  { fontSize: 12, color: PF.textSecondary },
  meta:  { fontSize: 10, fontWeight: '500', color: PF.textMuted },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: PF.bgCard, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: PF.border,
  },
  pillIcon:  { fontSize: 11 },
  pillLabel: { fontSize: 10, fontWeight: '600', color: PF.textSecondary },
  actions:   { flexDirection: 'row', gap: 8 },
  applyBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    backgroundColor: PF.accent, borderRadius: 10,
    shadowColor: PF.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 5,
  },
  applyTxt:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: PF.bgCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: PF.border,
  },
  iconBtnTxt: { fontSize: 16 },
  delBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(248,113,113,0.1)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
  },
  delTxt: { fontSize: 14 },
});
