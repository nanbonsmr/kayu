import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PF } from '@/constants/colors';
import { STICKER_PACKS } from '@/features/stickers/sticker-packs';
import { PaywallScreen } from '@/features/subscription/paywall-screen';
import { ProBadge } from '@/features/subscription/pro-badge';
import { useEditorStore } from '@/store/editor-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { uid } from '@/utils/id';

export function StickerPanel() {
  const addStickerLayer = useEditorStore((s) => s.addStickerLayer);
  const isPro           = useSubscriptionStore((s) => s.isActive);

  const [activePack, setActivePack]     = useState(STICKER_PACKS[0].id);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const currentPack = STICKER_PACKS.find((p) => p.id === activePack)!;
  const packLocked  = currentPack.premium && !isPro;

  const handleTabPress = (packId: string, premium: boolean) => {
    if (premium && !isPro) {
      setActivePack(packId); // show the pack but locked
    } else {
      setActivePack(packId);
    }
  };

  const handleAdd = (emoji: string) => {
    if (packLocked) {
      setPaywallVisible(true);
      return;
    }
    addStickerLayer({ id: uid(), emoji, x: 60, y: 80, fontSize: 56, rotation: 0 });
  };

  return (
    <View style={styles.container}>
      {/* Pack tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsStrip}
        bounces={false}>
        {STICKER_PACKS.map((pack) => {
          const active = activePack === pack.id;
          const locked = pack.premium && !isPro;
          return (
            <Pressable
              key={pack.id}
              onPress={() => handleTabPress(pack.id, pack.premium)}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                pressed && styles.tabPressed,
              ]}>
              <Text style={styles.tabIcon}>{pack.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {pack.name}
              </Text>
              {locked && <Text style={styles.tabLock}>🔒</Text>}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pack info */}
      <View style={styles.packInfo}>
        <View style={styles.packInfoLeft}>
          <Text style={styles.packName}>{currentPack.name}</Text>
          <Text style={styles.packCount}>{currentPack.stickers.length} stickers</Text>
        </View>
        {currentPack.premium && <ProBadge />}
      </View>

      {/* Locked overlay or sticker grid */}
      {packLocked ? (
        <Pressable style={styles.lockedState} onPress={() => setPaywallVisible(true)}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>Pro Pack</Text>
          <Text style={styles.lockedSub}>Upgrade to Kayu Pro to unlock this sticker pack</Text>
          <View style={styles.unlockBtn}>
            <Text style={styles.unlockBtnTxt}>Unlock with Pro →</Text>
          </View>
        </Pressable>
      ) : (
        <FlatList
          data={currentPack.stickers}
          keyExtractor={(item) => item.id}
          numColumns={5}
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleAdd(item.emoji)}
              style={({ pressed }) => [styles.stickerBtn, pressed && styles.stickerBtnPressed]}>
              <Text style={styles.stickerEmoji}>{item.emoji}</Text>
            </Pressable>
          )}
        />
      )}

      <View style={styles.tip}>
        <Text style={styles.tipText}>Tap to add · Drag to move · ⤡ resize · ↻ rotate</Text>
      </View>

      <PaywallScreen
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        featureName="Premium Stickers"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  tabsStrip: { flexGrow: 0 },
  tabs: {
    paddingHorizontal: 10, paddingVertical: 8, gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: PF.border,
  },
  tab: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border,
    gap: 3, minWidth: 58, position: 'relative',
  },
  tabActive:  { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  tabPressed: { opacity: 0.65 },
  tabIcon:    { fontSize: 16 },
  tabLabel:   { fontSize: 9, fontWeight: '600', color: PF.textMuted },
  tabLabelActive: { color: PF.accent },
  tabLock:    { position: 'absolute', top: 2, right: 2, fontSize: 8 },

  packInfo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: PF.border,
  },
  packInfoLeft: { gap: 1 },
  packName:  { fontSize: 12, fontWeight: '700', color: PF.textPrimary },
  packCount: { fontSize: 10, fontWeight: '400', color: PF.textMuted },

  grid:        { flex: 1 },
  gridContent: { paddingHorizontal: 6, paddingVertical: 6 },
  stickerBtn: {
    flex: 1, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: PF.bgElevated, borderRadius: 10, margin: 3,
    borderWidth: 1, borderColor: PF.border,
  },
  stickerBtnPressed: { opacity: 0.55, transform: [{ scale: 0.88 }] },
  stickerEmoji: { fontSize: 26 },

  lockedState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 24,
  },
  lockedIcon:  { fontSize: 36 },
  lockedTitle: { fontSize: 16, fontWeight: '700', color: PF.textPrimary },
  lockedSub:   { fontSize: 12, color: PF.textSecondary, textAlign: 'center', lineHeight: 18 },
  unlockBtn: {
    backgroundColor: PF.accent, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
    shadowColor: PF.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  unlockBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },

  tip: {
    alignItems: 'center', paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: PF.border,
  },
  tipText: { fontSize: 9, fontWeight: '500', color: PF.textMuted },
});
