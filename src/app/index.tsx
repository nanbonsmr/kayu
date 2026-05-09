import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PF } from '@/constants/colors';
import { PaywallScreen } from '@/features/subscription/paywall-screen';
import { generateThumbnail } from '@/services/image-service';
import { useAppStore } from '@/store/app-store';
import { useEditorStore } from '@/store/editor-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { RecentEdit } from '@/types/editor';
import { timeAgo } from '@/utils/format';
import { uid } from '@/utils/id';

const { width: SW } = Dimensions.get('window');

// ─── Feature pills shown in the hero ─────────────────────────────────────────
const FEATURES = [
  { icon: '🎚️', label: 'Adjust'   },
  { icon: '🎞️', label: 'Filters'  },
  { icon: '✏️', label: 'Draw'     },
  { icon: '𝐓',  label: 'Text'     },
  { icon: '😊', label: 'Stickers' },
  { icon: '💫', label: 'Effects'  },
];

// ─── Animated recent card with swipe-to-delete ───────────────────────────────
function RecentCard({
  item,
  onOpen,
  onDelete,
}: {
  item: RecentEdit;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const handleDelete = () => {
    Alert.alert('Remove', 'Remove this photo from recents?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Animated.View style={[styles.recentCardWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onOpen}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => setShowDelete((v) => !v)}
        delayLongPress={400}
        style={styles.recentCard}>
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.recentThumb}
          contentFit="cover"
        />
        {/* Gradient overlay */}
        <View style={styles.recentGradient} />
        <View style={styles.recentMeta}>
          <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.recentTime}>{timeAgo(item.editedAt)}</Text>
        </View>
      </Pressable>

      {/* Delete button — appears on long press */}
      {showDelete && (
        <Pressable onPress={handleDelete} style={styles.recentDeleteBtn}>
          <Text style={styles.recentDeleteIcon}>🗑️</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router           = useRouter();
  const recentEdits      = useAppStore((s) => s.recentEdits);
  const removeRecentEdit = useAppStore((s) => s.removeRecentEdit);
  const setSourceUri     = useEditorStore((s) => s.setSourceUri);
  const resetEditor      = useEditorStore((s) => s.resetEditor);
  const addRecentEdit    = useAppStore((s) => s.addRecentEdit);
  const loadSubscription = useSubscriptionStore((s) => s.loadSubscription);
  const isPro            = useSubscriptionStore((s) => s.isActive);

  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => { loadSubscription(); }, []);

  const openPicker = useCallback(
    async (source: 'camera' | 'gallery') => {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera access is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 1,
          allowsEditing: false,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Gallery access is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 1,
          allowsEditing: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        resetEditor();
        setSourceUri(asset.uri);
        try {
          const thumb = await generateThumbnail(asset.uri);
          addRecentEdit({
            id: uid(), uri: asset.uri, thumbnail: thumb,
            editedAt: Date.now(),
            name: asset.fileName ?? `Photo ${Date.now()}`,
          });
        } catch { /* non-critical */ }
        router.push('/editor');
      }
    },
    [resetEditor, setSourceUri, addRecentEdit, router]
  );

  const openRecent = useCallback(
    (edit: RecentEdit) => {
      resetEditor();
      setSourceUri(edit.uri);
      router.push('/editor');
    },
    [resetEditor, setSourceUri, router]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Logo mark */}
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>K</Text>
            </View>
            <View>
              <Text style={styles.appName}>Kayu</Text>
              <Text style={styles.appSub}>Photo Editor</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
          {!isPro && (
            <Pressable
              onPress={() => setPaywallVisible(true)}
              style={({ pressed }) => [styles.proBtn, pressed && { opacity: 0.8 }]}>
              <Text style={styles.proBtnTxt}>✨ Go Pro</Text>
            </Pressable>
          )}
        </View>

        {/* ── Hero card ── */}
        <View style={styles.heroCard}>
          {/* Multi-layer glow blobs */}
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />
          <View style={[styles.blob, styles.blob3]} />

          <View style={styles.heroContent}>
            {/* Big import buttons */}
            <View style={styles.importRow}>
              <Pressable
                onPress={() => openPicker('gallery')}
                style={({ pressed }) => [styles.importBtn, styles.importBtnPrimary, pressed && styles.importBtnPressed]}>
                <View style={styles.importBtnIconWrap}>
                  <Text style={styles.importBtnIcon}>🖼️</Text>
                </View>
                <View style={styles.importBtnText}>
                  <Text style={styles.importBtnTitle}>Gallery</Text>
                  <Text style={styles.importBtnSub}>Choose from photos</Text>
                </View>
                <Text style={styles.importBtnArrow}>›</Text>
              </Pressable>

              <Pressable
                onPress={() => openPicker('camera')}
                style={({ pressed }) => [styles.importBtn, styles.importBtnSecondary, pressed && styles.importBtnPressed]}>
                <View style={[styles.importBtnIconWrap, styles.importBtnIconWrapDark]}>
                  <Text style={styles.importBtnIcon}>📷</Text>
                </View>
                <View style={styles.importBtnText}>
                  <Text style={[styles.importBtnTitle, { color: PF.textPrimary }]}>Camera</Text>
                  <Text style={styles.importBtnSub}>Take a new photo</Text>
                </View>
                <Text style={[styles.importBtnArrow, { color: PF.textMuted }]}>›</Text>
              </Pressable>
            </View>

            {/* Feature pills */}
            <View style={styles.pillsRow}>
              {FEATURES.map((f) => (
                <View key={f.label} style={styles.pill}>
                  <Text style={styles.pillIcon}>{f.icon}</Text>
                  <Text style={styles.pillLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Stats bar ── */}
        <View style={styles.statsBar}>
          {[
            { value: '12', label: 'Filters' },
            { value: '∞', label: 'Layers' },
            { value: '4K', label: 'Export' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {i < 2 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Recent edits ── */}
        {recentEdits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Recent Edits</Text>
                <Text style={styles.sectionSub}>Long press to delete</Text>
              </View>
              <Pressable
                onPress={() =>
                  Alert.alert('Clear All', 'Remove all recent edits?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear All',
                      style: 'destructive',
                      onPress: () => recentEdits.forEach((e) => removeRecentEdit(e.id)),
                    },
                  ])
                }
                style={({ pressed }) => [styles.clearAllBtn, pressed && { opacity: 0.6 }]}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </Pressable>
            </View>

            <FlatList
              data={recentEdits}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
              renderItem={({ item }) => (
                <RecentCard
                  item={item}
                  onOpen={() => openRecent(item)}
                  onDelete={() => removeRecentEdit(item.id)}
                />
              )}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PaywallScreen
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: PF.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 6, gap: 20 },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: PF.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PF.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  logoMarkText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  appName: { fontSize: 20, fontWeight: '800', color: PF.textPrimary, letterSpacing: -0.4 },
  appSub:  { fontSize: 11, fontWeight: '500', color: PF.textSecondary, marginTop: 1 },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsIcon: { fontSize: 17 },

  // ── Hero card
  heroCard: {
    borderRadius: 28,
    backgroundColor: PF.bgCard,
    borderWidth: 1, borderColor: PF.borderLight,
    overflow: 'hidden',
    paddingBottom: 20,
  },
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: {
    width: 220, height: 220,
    backgroundColor: 'rgba(123,97,255,0.22)',
    top: -80, right: -60,
  },
  blob2: {
    width: 140, height: 140,
    backgroundColor: 'rgba(192,132,252,0.15)',
    top: 20, left: -40,
  },
  blob3: {
    width: 100, height: 100,
    backgroundColor: 'rgba(20,184,166,0.12)',
    bottom: -20, right: 40,
  },

  heroContent: { padding: 18, gap: 16 },

  // Import buttons
  importRow: { gap: 10 },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  importBtnPrimary: {
    backgroundColor: PF.accent,
    shadowColor: PF.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 10,
  },
  importBtnSecondary: {
    backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.borderLight,
  },
  importBtnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  importBtnIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  importBtnIconWrapDark: { backgroundColor: PF.bgCard },
  importBtnIcon:  { fontSize: 22 },
  importBtnText:  { flex: 1 },
  importBtnTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  importBtnSub:   { fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  importBtnArrow: { fontSize: 22, color: 'rgba(255,255,255,0.7)', fontWeight: '300' },

  // Feature pills
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillIcon:  { fontSize: 13 },
  pillLabel: { fontSize: 11, fontWeight: '600', color: PF.textSecondary },

  // ── Stats bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: PF.bgCard,
    borderRadius: 18,
    borderWidth: 1, borderColor: PF.border,
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 22, fontWeight: '800', color: PF.accent, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '500', color: PF.textSecondary },
  statDivider: { width: 1, backgroundColor: PF.border, marginVertical: 4 },

  // ── Recent edits
  section: { gap: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: PF.textPrimary, letterSpacing: -0.2 },
  sectionSub:   { fontSize: 11, fontWeight: '400', color: PF.textMuted, marginTop: 2 },
  clearAllBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
  },
  clearAllText: { fontSize: 12, fontWeight: '600', color: PF.error },

  recentList: { gap: 12, paddingBottom: 4, paddingTop: 2 },

  recentCardWrap: { position: 'relative' },
  recentCard: {
    width: 120, height: 155,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border,
  },
  recentThumb: { width: '100%', height: '100%' },
  recentGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  recentMeta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 8,
  },
  recentName: {
    fontSize: 10, fontWeight: '600',
    color: '#fff', marginBottom: 1,
  },
  recentTime: { fontSize: 9, fontWeight: '400', color: 'rgba(255,255,255,0.65)' },
  recentDeleteBtn: {
    position: 'absolute',
    top: -8, right: -8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: PF.error,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
    zIndex: 10,
  },
  recentDeleteIcon: { fontSize: 13 },

  proBtn: {
    backgroundColor: PF.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: PF.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  proBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },

});
