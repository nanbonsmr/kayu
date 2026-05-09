import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { PF } from '@/constants/colors';

interface IconButtonProps {
  icon: string;
  label?: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

export function IconButton({
  icon,
  label,
  onPress,
  active = false,
  size = 44,
  style,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        active && styles.active,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <Text style={{ fontSize: size * 0.45 }}>{icon}</Text>
      {label ? (
        <Text style={[styles.label, { color: active ? PF.accent : PF.textSecondary }]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PF.bgElevated,
  },
  active: {
    backgroundColor: PF.accentDim,
    borderWidth: 1,
    borderColor: PF.borderActive,
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  label: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
  },
});
