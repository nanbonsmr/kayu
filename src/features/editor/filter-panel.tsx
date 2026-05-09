import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Slider } from '@/components/ui/slider';
import { PF } from '@/constants/colors';
import { FILTER_CATEGORIES, FILTER_PRESETS } from '@/features/filters/filter-presets';
import { PaywallScreen } from '@/features/subscription/paywall-screen';
import { ProBadge } from '@/features/subscription/pro-badge';
import { useEditorStore } from '@/store/editor-store';
import { useSubscriptionStore } from '@/store/subscription-store';

const THUMB = 68;

export function FilterPanel() {
  const sourceUri          = useEditorStore((s) => s.sourceUri);
  const activeFilterId     = useEditorStore((s) => s.activeFilterId);
  const filterIntensity    = useEditorStore((s) => s.filterIntensity);
  const setActiveFilter    = useEditorStore((s) => s.setActiveFilter);
  const setFilterIntensity = useEditorStore((s) => s.setFilterIntensity);
  const saveSnapshot       = useEditorStore((s) => s.saveSnapshot);
  const isPro              = useSubscriptionStore((s) => s.isActive);

  const [activeCategory, setActiveCategory] = useState('all');
  const [paywallVisible, setPaywallVisible] = useState(false);

  const handleSelect = useCallback(
    (id: string, premium: boolean) => {
      if (premium && !isPro) {
        setPaywallVisible(true);
        return;
      }
      setActiveFilter(id === activeFilterId ? null : id, filterIntensity);
      saveSnapshot(`Filter: ${id}`);
    },
    [activeFilterId, filterIntensity, isPro, setActiveFilter, saveSnapshot]
  );

  const visiblePresets = useMemo(() => {
    const cat = FILTER_CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat) return FILTER_PRESETS;
    return FILTER_PRESETS.filter((p) => cat.ids.includes(p.id));
  }, [activeCategory]);

  return (
    <View style={styles.container}>
      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        style={styles.catStrip}
        bounces={false}>
        {FILTER_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setActiveCategory(cat.id)}
            style={({ pressed }) => [
              styles.catBtn,
              activeCategory === cat.id && styles.catBtnActive,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Intensity row */}
      <View style={styles.intensityRow}>
        <Text style={styles.intensityLabel}>Intensity</Text>
        <View style={styles.sliderWrap}>
          <Slider
            value={filterIntensity}
            onChange={setFilterIntensity}
            onChangeEnd={() => saveSnapshot('Filter intensity')}
            accentColor={activeFilterId && activeFilterId !== 'none' ? PF.accent : PF.textMuted}
          />
        </View>
        <Text style={[
          styles.intensityVal,
          activeFilterId && activeFilterId !== 'none' && styles.intensityValActive,
        ]}>
          {Math.round(filterIntensity * 100)}%
        </Text>
      </View>

      {/* Filter strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.strip}
        bounces={false}>
        {visiblePresets.map((preset) => {
          const active  = activeFilterId === preset.id;
          const locked  = preset.premium && !isPro;
          return (
            <Pressable
              key={preset.id}
              onPress={() => handleSelect(preset.id, preset.premium)}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.itemPressed,
              ]}>
              <View style={[styles.thumb, active && styles.thumbActive, locked && styles.thumbLocked]}>
                {sourceUri ? (
                  <Image source={{ uri: sourceUri }} style={styles.thumbImg} contentFit="cover" />
                ) : (
                  <View style={[styles.thumbImg, styles.thumbPlaceholder]} />
                )}
                {preset.id !== 'none' && (
                  <View style={[styles.overlay, getOverlay(preset.id)]} />
                )}
                {/* Lock overlay for premium */}
                {locked && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                  </View>
                )}
              </View>
              <View style={styles.filterNameRow}>
                <Text style={[styles.filterName, active && styles.filterNameActive]}>
                  {preset.name}
                </Text>
                {preset.premium && <ProBadge small />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <PaywallScreen
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        featureName="Premium Filters"
      />
    </View>
  );
}

function getOverlay(id: string): object {
  const map: Record<string, object> = {
    cinematic:     { backgroundColor: 'rgba(20,40,80,0.22)'    },
    noir:          { backgroundColor: 'rgba(0,0,0,0.45)'       },
    'teal-orange': { backgroundColor: 'rgba(20,120,100,0.2)'   },
    blockbuster:   { backgroundColor: 'rgba(180,80,20,0.18)'   },
    'film-noir':   { backgroundColor: 'rgba(0,0,0,0.5)'        },
    moody:         { backgroundColor: 'rgba(30,30,60,0.25)'    },
    epic:          { backgroundColor: 'rgba(60,0,0,0.2)'       },
    vintage:       { backgroundColor: 'rgba(180,120,60,0.28)'  },
    kodak:         { backgroundColor: 'rgba(255,200,100,0.15)' },
    fuji:          { backgroundColor: 'rgba(100,200,180,0.12)' },
    polaroid:      { backgroundColor: 'rgba(255,240,200,0.18)' },
    'film-grain':  { backgroundColor: 'rgba(100,80,60,0.15)'   },
    'retro-70s':   { backgroundColor: 'rgba(200,140,60,0.22)'  },
    'retro-80s':   { backgroundColor: 'rgba(255,50,150,0.15)'  },
    'cross-process':{ backgroundColor: 'rgba(0,200,100,0.15)'  },
    lomo:          { backgroundColor: 'rgba(0,0,0,0.2)'        },
    warm:          { backgroundColor: 'rgba(255,160,50,0.18)'  },
    cool:          { backgroundColor: 'rgba(50,120,255,0.18)'  },
    golden:        { backgroundColor: 'rgba(255,200,50,0.22)'  },
    sunset:        { backgroundColor: 'rgba(255,100,30,0.25)'  },
    sunrise:       { backgroundColor: 'rgba(255,180,80,0.18)'  },
    midnight:      { backgroundColor: 'rgba(10,10,60,0.35)'    },
    dusk:          { backgroundColor: 'rgba(80,40,120,0.2)'    },
    neon:          { backgroundColor: 'rgba(200,0,255,0.15)'   },
    cyberpunk:     { backgroundColor: 'rgba(0,200,255,0.15)'   },
    fade:          { backgroundColor: 'rgba(255,255,255,0.14)' },
    matte:         { backgroundColor: 'rgba(100,100,120,0.12)' },
    pastel:        { backgroundColor: 'rgba(255,200,220,0.18)' },
    airy:          { backgroundColor: 'rgba(255,255,255,0.2)'  },
    dreamy:        { backgroundColor: 'rgba(200,180,255,0.15)' },
    haze:          { backgroundColor: 'rgba(255,255,255,0.25)' },
    'soft-pink':   { backgroundColor: 'rgba(255,180,200,0.2)'  },
    'cotton-candy':{ backgroundColor: 'rgba(255,150,220,0.18)' },
    vivid:         { backgroundColor: 'rgba(255,80,80,0.1)'    },
    dramatic:      { backgroundColor: 'rgba(0,0,0,0.18)'       },
    punch:         { backgroundColor: 'rgba(255,60,0,0.12)'    },
    pop:           { backgroundColor: 'rgba(255,0,150,0.1)'    },
    chrome:        { backgroundColor: 'rgba(200,220,255,0.12)' },
    sepia:         { backgroundColor: 'rgba(160,120,60,0.3)'   },
    charcoal:      { backgroundColor: 'rgba(0,0,0,0.3)'        },
    forest:        { backgroundColor: 'rgba(30,100,30,0.18)'   },
    ocean:         { backgroundColor: 'rgba(0,80,180,0.18)'    },
    desert:        { backgroundColor: 'rgba(200,140,60,0.2)'   },
    arctic:        { backgroundColor: 'rgba(180,220,255,0.2)'  },
    tropical:      { backgroundColor: 'rgba(0,200,100,0.15)'   },
    portrait:      { backgroundColor: 'rgba(255,220,200,0.1)'  },
    'skin-glow':   { backgroundColor: 'rgba(255,200,160,0.15)' },
    'soft-light':  { backgroundColor: 'rgba(255,255,255,0.12)' },
    beauty:        { backgroundColor: 'rgba(255,210,190,0.12)' },
  };
  return map[id] ?? {};
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  catStrip: { flexGrow: 0 },
  catRow: {
    paddingHorizontal: 10, paddingVertical: 8, gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: PF.border,
  },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, backgroundColor: PF.bgElevated,
    borderWidth: 1, borderColor: PF.border,
  },
  catBtnActive:   { backgroundColor: PF.accentDim, borderColor: PF.borderActive },
  catLabel:       { fontSize: 11, fontWeight: '600', color: PF.textMuted },
  catLabelActive: { color: PF.accent },
  pressed:        { opacity: 0.65 },

  intensityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: PF.border,
  },
  intensityLabel:    { fontSize: 11, fontWeight: '600', color: PF.textSecondary, width: 58 },
  sliderWrap:        { flex: 1 },
  intensityVal:      { fontSize: 11, fontWeight: '700', color: PF.textMuted, width: 36, textAlign: 'right' },
  intensityValActive:{ color: PF.accent },

  strip: { flexGrow: 0, height: THUMB + 42 },
  list:  { paddingHorizontal: 10, paddingVertical: 8, gap: 8, alignItems: 'flex-start' },

  item:        { alignItems: 'center', gap: 4, paddingHorizontal: 3, paddingVertical: 3, borderRadius: 12 },
  itemActive:  { backgroundColor: PF.accentDim },
  itemPressed: { opacity: 0.7 },

  thumb: {
    width: THUMB, height: THUMB, borderRadius: 12,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive:      { borderColor: PF.accent },
  thumbLocked:      { opacity: 0.6 },
  thumbImg:         { width: '100%', height: '100%' },
  thumbPlaceholder: { backgroundColor: PF.bgElevated },
  overlay:          { ...StyleSheet.absoluteFillObject },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  lockIcon: { fontSize: 18 },

  filterNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  filterName:       { fontSize: 9, fontWeight: '500', color: PF.textMuted, textAlign: 'center' },
  filterNameActive: { color: PF.accent, fontWeight: '700' },
});
