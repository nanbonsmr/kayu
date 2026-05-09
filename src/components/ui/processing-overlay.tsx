import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { PF } from '@/constants/colors';
import { PFText } from './pf-text';

interface ProcessingOverlayProps {
  visible: boolean;
  label?: string;
}

export function ProcessingOverlay({ visible, label }: ProcessingOverlayProps) {
  const opacity  = useRef(new Animated.Value(0)).current;
  const pulse    = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      // Pulse ring
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      ).start();
      // Spin arc
      Animated.loop(
        Animated.timing(rotation, { toValue: 1, duration: 1000, useNativeDriver: true })
      ).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      pulse.stopAnimation();
      rotation.stopAnimation();
      pulse.setValue(1);
      rotation.setValue(0);
    }
  }, [visible]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <View style={styles.card}>
        {/* Pulsing ring */}
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]} />
        {/* Spinning arc */}
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
          <View style={styles.spinnerArc} />
        </Animated.View>
        {/* Inner dot */}
        <View style={styles.innerDot} />

        {label ? (
          <PFText style={styles.label}>{label}</PFText>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: PF.bgCard,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 150,
    borderWidth: 1,
    borderColor: PF.borderLight,
    shadowColor: PF.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  ring: {
    position: 'absolute',
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5,
    borderColor: PF.accentDim,
  },
  spinner: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: PF.accent,
    borderRightColor: PF.accentLight,
  },
  spinnerArc: {
    position: 'absolute',
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: PF.accentLight,
    top: -4, right: 20,
  },
  innerDot: {
    position: 'absolute',
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: PF.accent,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: PF.textSecondary,
    textAlign: 'center',
    maxWidth: 160,
  },
});
