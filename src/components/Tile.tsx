import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import AppIcon from './AppIcon';

export default function Tile({
  icon,
  label,
  bg,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  bg: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.tile, { backgroundColor: bg }]} onPress={onPress}>
      <AppIcon name={icon} size={26} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: { flexBasis: '48%', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 10, alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700', marginTop: 7, fontFamily: 'Nunito_700Bold' },
});
