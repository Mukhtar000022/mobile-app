import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Balloon from './Balloon';
import AppIcon from './AppIcon';
import { colors } from '../theme';

export default function AppBar({ title, onMenuPress }: { title: string; onMenuPress: () => void }) {
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Balloon size={26} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity onPress={onMenuPress} hitSlop={10}>
        <AppIcon name="menu-2" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { fontSize: 16, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },
});
