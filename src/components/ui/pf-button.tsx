import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle,
} from 'react-native';

import { PF } from '@/constants/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface PFButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function PFButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: PFButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? PF.white : PF.accent}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, styles[`label_${variant}`], styles[`label_${size}`]]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },

  primary:   { backgroundColor: PF.accent },
  secondary: { backgroundColor: PF.bgElevated, borderWidth: 1, borderColor: PF.border },
  ghost:     { backgroundColor: PF.transparent },
  danger:    { backgroundColor: PF.error },

  sm: { paddingHorizontal: 14, paddingVertical: 8 },
  md: { paddingHorizontal: 20, paddingVertical: 13 },
  lg: { paddingHorizontal: 28, paddingVertical: 16 },

  label:           { fontWeight: '600' },
  label_primary:   { color: PF.white },
  label_secondary: { color: PF.textPrimary },
  label_ghost:     { color: PF.accent },
  label_danger:    { color: PF.white },
  label_sm:        { fontSize: 13 },
  label_md:        { fontSize: 15 },
  label_lg:        { fontSize: 17 },
});
