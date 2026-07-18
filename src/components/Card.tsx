import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import AppIcon from './AppIcon';
import { palettes, PaletteKey } from '../theme';

export default function Card({
  icon,
  title,
  desc,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  desc: string;
  color?: string;
  onPress?: () => void;
}) {
  const p = palettes[(color as PaletteKey) || 'orange'];
  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.card, { backgroundColor: p.bg }]} onPress={onPress}>
      <View style={[styles.ic, { backgroundColor: p.icon }]}>
        <AppIcon name={icon} size={21} color="#fff" />
      </View>
      <View style={styles.info}>
        <Text style={[styles.nm, { color: p.text }]}>{title}</Text>
        <Text style={[styles.ds, { color: p.sub }]}>{desc}</Text>
      </View>
      <AppIcon name="chevron-right" size={18} color={p.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 13, marginBottom: 11 },
  ic: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  nm: { fontSize: 14, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
  ds: { fontSize: 11, fontWeight: '600', marginTop: 1, fontFamily: 'Nunito_600SemiBold' },
});
