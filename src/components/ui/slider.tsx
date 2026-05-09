import { useCallback, useRef } from 'react';
import {
    Animated,
    PanResponder,
    StyleSheet,
    View,
} from 'react-native';

import { PF } from '@/constants/colors';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  onChangeEnd?: (v: number) => void;
  accentColor?: string;
  trackHeight?: number;
  thumbSize?: number;
}

export function Slider({
  value,
  min = 0,
  max = 1,
  onChange,
  onChangeEnd,
  accentColor = PF.accent,
  trackHeight = 4,
  thumbSize = 22,
}: SliderProps) {
  const trackWidth  = useRef(0);
  const thumbScale  = useRef(new Animated.Value(1)).current;
  const isDragging  = useRef(false);
  const startX      = useRef(0);
  const startValue  = useRef(value);

  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

  const valueToX = useCallback(
    (v: number) => ((v - min) / (max - min)) * trackWidth.current,
    [min, max]
  );

  const xToValue = useCallback(
    (x: number) => min + (clamp(x, 0, trackWidth.current) / trackWidth.current) * (max - min),
    [min, max]
  );

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        isDragging.current = true;
        startX.current     = e.nativeEvent.locationX;
        startValue.current = value;
        Animated.spring(thumbScale, { toValue: 1.25, useNativeDriver: true, speed: 40 }).start();
        // Immediately jump to tap position
        const newVal = xToValue(e.nativeEvent.locationX);
        onChange(newVal);
      },
      onPanResponderMove: (e, g) => {
        const x      = clamp(startX.current + g.dx, 0, trackWidth.current);
        const newVal = xToValue(x);
        onChange(newVal);
      },
      onPanResponderRelease: (e, g) => {
        isDragging.current = false;
        Animated.spring(thumbScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
        const x      = clamp(startX.current + g.dx, 0, trackWidth.current);
        const newVal = xToValue(x);
        onChangeEnd?.(newVal);
      },
    })
  ).current;

  // Compute thumb position from current value
  const thumbX = trackWidth.current > 0
    ? valueToX(value)
    : 0;

  const fillWidth = trackWidth.current > 0
    ? Math.max(0, valueToX(value))
    : 0;

  return (
    <View
      style={[styles.track, { height: Math.max(thumbSize, 28) }]}
      onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
      {...responder.panHandlers}>

      {/* Track background */}
      <View style={[styles.trackBg, { height: trackHeight, borderRadius: trackHeight / 2 }]} />

      {/* Fill */}
      <View
        style={[
          styles.fill,
          {
            width:        fillWidth,
            height:       trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor: accentColor,
          },
        ]}
      />

      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            width:        thumbSize,
            height:       thumbSize,
            borderRadius: thumbSize / 2,
            borderColor:  accentColor,
            left:         thumbX - thumbSize / 2,
            transform:    [{ scale: thumbScale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: PF.bgElevated,
  },
  fill: {
    position: 'absolute',
    left: 0,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: PF.white,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
