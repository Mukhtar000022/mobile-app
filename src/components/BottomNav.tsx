import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppIcon from './AppIcon';
import { colors } from '../theme';
import { ScreenName } from '../navigation';

const ITEMS: { key: ScreenName; label: string; icon: string }[] = [
  { key: 'home', label: 'Главная', icon: 'home' },
  { key: 'courses', label: 'Кружки', icon: 'confetti' },
  { key: 'gallery', label: 'Галерея', icon: 'photo' },
  { key: 'contacts', label: 'Контакты', icon: 'phone' },
];

export default function BottomNav({ current, onSelect }: { current: ScreenName; onSelect: (s: ScreenName) => void }) {
  return (
    <View style={styles.nav}>
      {ITEMS.map((item) => {
        const on = current === item.key;
        return (
          <TouchableOpacity key={item.key} style={styles.item} onPress={() => onSelect(item.key)}>
            <AppIcon name={item.icon} size={21} color={on ? colors.primary : colors.navInactive} />
            <Text style={[styles.label, { color: on ? colors.primary : colors.navInactive }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: 62,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 10, fontWeight: '700', fontFamily: 'Nunito_700Bold' },
});
