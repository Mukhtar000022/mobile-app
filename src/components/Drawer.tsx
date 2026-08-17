import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import Balloon from './Balloon';
import { colors } from '../theme';
import { ScreenName } from '../navigation';
import { useI18n } from '../i18n';
import { LANGUAGES } from '../i18n/translations';
import { useAuth } from '../auth';

const DRAWER_WIDTH = 255;

// Боковое меню повторяет нижнее — чтобы разделы не расходились.
// Дополнительно у родителя — оплата; у воспитателя — только рабочие разделы.
const TUTOR_MENU: { tKey: string; screen: ScreenName }[] = [
  { tKey: 'nav.day', screen: 'day' },
  { tKey: 'nav.attendance', screen: 'attendance' },
  { tKey: 'nav.devcard', screen: 'devcard' },
  { tKey: 'nav.chat', screen: 'chat' },
  { tKey: 'nav.cabinet', screen: 'cabinet' },
];

const PARENT_MENU: { tKey: string; screen: ScreenName }[] = [
  { tKey: 'nav.home_parent', screen: 'home' },
  { tKey: 'nav.routine', screen: 'routine' },
  { tKey: 'nav.chat', screen: 'chat' },
  { tKey: 'nav.cabinet', screen: 'cabinet' },
];

export default function Drawer({
  open,
  onClose,
  onNavigate,
  onPay,
  payEnabled,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenName) => void;
  onPay?: () => void;
  payEnabled?: boolean;
}) {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    Animated.parallel([
      Animated.timing(translateX, { toValue: open ? 0 : -DRAWER_WIDTH, duration: 260, useNativeDriver: true }),
      Animated.timing(scrimOpacity, { toValue: open ? 1 : 0, duration: 260, useNativeDriver: true }),
    ]).start(() => {
      if (!open) setMounted(false);
    });
  }, [open]);

  if (!mounted) return null;

  const go = (screen: ScreenName) => {
    onNavigate(screen);
    onClose();
  };

  // Воспитателю витрина детского сада («Главная», «Галерея») не нужна.
  const isTutor = user?.role === 'tutor';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: scrimOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <View style={[styles.head, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headLeft}>
            <Balloon size={30} />
            <Text style={styles.headTitle}>Аяла Kids</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <AppIcon name="x" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {(isTutor ? TUTOR_MENU : PARENT_MENU).map((it) => (
            <MenuRow key={it.screen} label={t(it.tKey)} onPress={() => go(it.screen)} />
          ))}

          {/* Родителю — оплата и разделы, которые наполняет админ */}
          {!isTutor && payEnabled !== false && !!onPay && (
            <MenuRow
              label={t('nav.payment')}
              onPress={() => {
                onClose();
                onPay();
              }}
            />
          )}
          <MenuRow label={t('nav.contacts')} onPress={() => go('contacts')} noBorder />

          <View style={styles.langBox}>
            <Text style={styles.langLabel}>{t('common.language')}</Text>
            <View style={styles.langRow}>
              {LANGUAGES.map((l) => {
                const on = lang === l.code;
                return (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.langBtn, on && styles.langBtnOn]}
                    onPress={() => setLang(l.code)}
                  >
                    <Text style={[styles.langBtnText, on && styles.langBtnTextOn]}>{l.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {!!user && (
            <View style={styles.account}>
              <Text style={styles.accountText}>
                {t('login.logged_as')} {user.phone_number}
                {'  '}· {user.role === 'tutor' ? t('login.role_tutor') : t('login.role_parent')}
              </Text>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  onClose();
                  logout();
                }}
              >
                <AppIcon name="arrow-left" size={16} color="#c0392b" />
                <Text style={styles.logoutText}>{t('menu.logout')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function MenuRow({ label, onPress, noBorder }: { label: string; onPress: () => void; noBorder?: boolean }) {
  return (
    <TouchableOpacity style={[styles.mrow, noBorder && { borderBottomWidth: 0 }]} onPress={onPress}>
      <Text style={styles.mrowLabel}>{label}</Text>
      <AppIcon name="chevron-right" size={16} color="#cdbcb2" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim, zIndex: 40 },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.white,
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 0 },
    elevation: 20,
  },
  head: {
    paddingTop: 46,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: colors.heroBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headTitle: { fontSize: 17, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },
  body: { flex: 1, paddingHorizontal: 14, paddingTop: 8 },
  mrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mrowLabel: { fontSize: 14, fontWeight: '700', color: '#4a3b33', fontFamily: 'Nunito_700Bold' },
  group: { borderBottomWidth: 1, borderBottomColor: colors.border },
  groupHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
  },
  groupLabel: { fontSize: 14, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },
  sub: { backgroundColor: '#FCF1EC', borderRadius: 12, marginHorizontal: 2, marginBottom: 8 },
  subItem: { paddingVertical: 9, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f3ddd1' },
  subLabel: { fontSize: 12.5, fontWeight: '600', color: colors.primaryDark, fontFamily: 'Nunito_600SemiBold' },

  langBox: { marginTop: 18, paddingHorizontal: 6, paddingBottom: 24 },
  langLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, marginBottom: 8, fontFamily: 'Nunito_700Bold' },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  langBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  langBtnText: { fontSize: 13, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },
  langBtnTextOn: { color: '#fff' },

  account: { paddingHorizontal: 6, paddingBottom: 24 },
  accountText: { fontSize: 11, fontWeight: '600', color: colors.muted, marginBottom: 10, fontFamily: 'Nunito_600SemiBold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#c0392b', fontFamily: 'Nunito_800ExtraBold' },
});
