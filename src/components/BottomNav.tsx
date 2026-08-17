import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppIcon from './AppIcon';
import { colors } from '../theme';
import { ScreenName } from '../navigation';
import { useI18n } from '../i18n';
import { useChat } from '../chatContext';
import { useAuth } from '../auth';

// shortKey — короткая подпись для узкой кнопки; если её нет, берётся tKey.
type NavItem = { key: ScreenName; tKey: string; shortKey?: string; icon: string };

// У воспитателя — рабочие разделы группы: день (есеп/мәзір/тәртіп/фото),
// посещаемость, карта развития, чат.
const TUTOR_ITEMS: NavItem[] = [
  { key: 'day', tKey: 'nav.day', shortKey: 'nav.day_short', icon: 'clock' },
  { key: 'attendance', tKey: 'nav.attendance', shortKey: 'nav.attendance_short', icon: 'check' },
  { key: 'devcard', tKey: 'nav.devcard', shortKey: 'nav.devcard_short', icon: 'clipboard-list' },
  { key: 'chat', tKey: 'nav.chat', icon: 'chat' },
  { key: 'cabinet', tKey: 'nav.cabinet', icon: 'account' },
];

// У родителя — «Басты» (день ребёнка), күн тәртібі, чат и профиль.
const PARENT_ITEMS: NavItem[] = [
  { key: 'home', tKey: 'nav.home_parent', shortKey: 'nav.home_short', icon: 'home' },
  { key: 'routine', tKey: 'nav.routine', shortKey: 'nav.routine_short', icon: 'clock' },
  { key: 'chat', tKey: 'nav.chat', icon: 'chat' },
  { key: 'cabinet', tKey: 'nav.cabinet', icon: 'account' },
];

export default function BottomNav({ current, onSelect }: { current: ScreenName; onSelect: (s: ScreenName) => void }) {
  const { t } = useI18n();
  const { totalUnread } = useChat();
  const { user } = useAuth();
  const items = user?.role === 'tutor' ? TUTOR_ITEMS : PARENT_ITEMS;

  return (
    <View style={styles.nav}>
      {items.map((item) => {
        const on = current === item.key;
        // Непрочитанные показываем точкой-счётчиком на иконке чата.
        const badge = item.key === 'chat' && totalUnread > 0 ? totalUnread : 0;
        return (
          <TouchableOpacity key={item.key} style={styles.item} onPress={() => onSelect(item.key)}>
            <View>
              <AppIcon name={item.icon} size={21} color={on ? colors.primary : colors.navInactive} />
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </View>
            <Text
              style={[styles.label, { color: on ? colors.primary : colors.navInactive }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {t(item.shortKey || item.tKey)}
            </Text>
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
  // paddingHorizontal + minWidth:0 не дают подписи налезать на соседнюю кнопку
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 2 },
  label: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    fontFamily: 'Nunito_700Bold',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
});
