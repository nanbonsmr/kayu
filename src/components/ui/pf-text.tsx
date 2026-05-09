import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

import { PF } from '@/constants/colors';

type Variant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'label'
  | 'micro';

interface PFTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  bold?: boolean;
  center?: boolean;
}

export function PFText({
  variant = 'body',
  color,
  bold,
  center,
  style,
  ...rest
}: PFTextProps) {
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { color: color ?? PF.textPrimary },
        bold && styles.bold,
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
  bold: { fontWeight: '700' },
  center: { textAlign: 'center' },
  display: { fontSize: 32, fontWeight: '700', lineHeight: 38 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  subtitle: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0.5 },
  micro: { fontSize: 10, fontWeight: '500', lineHeight: 14 },
});
