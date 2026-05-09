import React, { useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PFText } from '@/components/ui/pf-text';
import { PF } from '@/constants/colors';
import { useEditorStore } from '@/store/editor-store';
import { ToolTab } from '@/types/editor';

interface Tab { id: ToolTab; icon: string; label: string; color: string }

const TABS: Tab[] = [
  { id: 'adjust',   icon: '🎚️', label: 'Adjust',   color: PF.teal   },
  { id: 'curves',   icon: '📈', label: 'Curves',   color: '#F59E0B' },
  { id: 'hsl',      icon: '🌈', label: 'HSL',      color: PF.pink   },
  { id: 'grading',  icon: '🎨', label: 'Grading',  color: PF.violet },
  { id: 'filters',  icon: '🎞️', label: 'Filters',  color: PF.orange },
  { id: 'effects',  icon: '💫', label: 'Effects',  color: '#EC4899' },
  { id: 'crop',     icon: '✂️', label: 'Crop',     color: PF.teal   },
  { id: 'shapes',   icon: '⬟',  label: 'Shapes',   color: '#14B8A6' },
  { id: 'draw',     icon: '✏️', label: 'Draw',     color: PF.amber  },
  { id: 'text',     icon: '𝐓',  label: 'Text',     color: PF.rose   },
  { id: 'stickers', icon: '😊', label: 'Stickers', color: PF.violet },
];

function TabItem({ tab, active, onPress }: { tab: Tab; active: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          styles.tab,
          active && [styles.tabActive, { borderColor: tab.color + '55' }],
          { transform: [{ scale }] },
        ]}>
        {active && <View style={[styles.tabGlow, { backgroundColor: tab.color + '22' }]} />}
        <PFText style={styles.tabIcon}>{tab.icon}</PFText>
        <PFText style={[styles.tabLabel, active && { color: tab.color, fontWeight: '700' }]}>
          {tab.label}
        </PFText>
        {active && <View style={[styles.dot, { backgroundColor: tab.color }]} />}
      </Animated.View>
    </Pressable>
  );
}

export function EditorToolbar() {
  const activeTab    = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        bounces={false}>
        {TABS.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            active={activeTab === tab.id}
            onPress={() => setActiveTab(tab.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 66,
    backgroundColor: PF.toolbarBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PF.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PF.border,
    justifyContent: 'center',
  },
  row: { paddingHorizontal: 8, alignItems: 'center', gap: 4 },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 14, gap: 3, minWidth: 60,
    position: 'relative',
    borderWidth: 1, borderColor: 'transparent',
  },
  tabActive:  { backgroundColor: 'rgba(255,255,255,0.04)' },
  tabGlow:    { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
  tabIcon:    { fontSize: 18 },
  tabLabel:   { fontSize: 10, fontWeight: '500', color: PF.textMuted, letterSpacing: 0.1 },
  dot:        { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2 },
});
