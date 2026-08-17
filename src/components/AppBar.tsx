import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Balloon from './Balloon';
import AppIcon from './AppIcon';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { LANGUAGES } from '../i18n/translations';

export default function AppBar({ title, onMenuPress }: { title: string; onMenuPress: () => void }) {
  const { lang, setLang } = useI18n();
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Balloon size={26} />
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.right}>
        <View style={styles.langToggle}>
          {LANGUAGES.map((l) => {
            const on = lang === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.langBtn, on && styles.langBtnOn]}
                onPress={() => setLang(l.code)}
                hitSlop={6}
              >
                <Text style={[styles.langText, on && styles.langTextOn]}>{l.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity onPress={onMenuPress} hitSlop={10}>
          <AppIcon name="menu-2" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
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
  left: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, marginRight: 10 },
  title: { fontSize: 16, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold', flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3E3DB',
    borderRadius: 20,
    padding: 2,
  },
  langBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 18 },
  langBtnOn: { backgroundColor: colors.primary },
  langText: { fontSize: 12, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },
  langTextOn: { color: '#fff' },
});
