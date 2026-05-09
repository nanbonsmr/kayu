import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function ProBadge({ small = false }: { small?: boolean }) {
  return (
    <View style={[S.badge, small && S.badgeSmall]}>
      <Text style={[S.txt, small && S.txtSmall]}>PRO</Text>
    </View>
  );
}

const S = StyleSheet.create({
  badge: {
    backgroundColor: '#F5C842',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  badgeSmall: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  txt:        { fontSize: 9, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  txtSmall:   { fontSize: 7 },
});
