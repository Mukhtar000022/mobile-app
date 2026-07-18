import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable } from 'react-native';
import AppIcon from './AppIcon';
import Balloon from './Balloon';
import { colors } from '../theme';
import { ScreenName } from '../navigation';

const DRAWER_WIDTH = 255;

type MenuGroup = { key: string; label: string; items: { label: string; screen: ScreenName }[] };

const GROUPS: MenuGroup[] = [
  {
    key: 'edu',
    label: 'Образование',
    items: [
      { label: 'Программы', screen: 'education' },
      { label: 'Предметы', screen: 'education' },
      { label: 'Расписание', screen: 'education' },
      { label: 'Психомоторное развитие', screen: 'education' },
      { label: 'Эмоциональный интеллект', screen: 'education' },
    ],
  },
  {
    key: 'par',
    label: 'Родителям',
    items: [
      { label: 'Распорядок дня', screen: 'parents' },
      { label: 'Питание', screen: 'parents' },
      { label: 'Кружки и секции', screen: 'courses' },
      { label: 'Памятка для родителей', screen: 'parents' },
      { label: 'Цены и условия', screen: 'parents' },
    ],
  },
];

export default function Drawer({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenName) => void;
}) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
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

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: scrimOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <View style={styles.head}>
          <View style={styles.headLeft}>
            <Balloon size={30} />
            <Text style={styles.headTitle}>Аяла Kids</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <AppIcon name="x" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <MenuRow label="Главная" onPress={() => go('home')} />
          <MenuRow label="О нас" onPress={() => go('contacts')} />

          {GROUPS.map((group) => {
            const isOpen = !!expanded[group.key];
            return (
              <View key={group.key} style={styles.group}>
                <TouchableOpacity
                  style={styles.groupHead}
                  onPress={() => setExpanded((e) => ({ ...e, [group.key]: !e[group.key] }))}
                >
                  <Text style={styles.groupLabel}>{group.label}</Text>
                  <AppIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} color={colors.primary} />
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.sub}>
                    {group.items.map((it, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.subItem, idx === group.items.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() => go(it.screen)}
                      >
                        <Text style={styles.subLabel}>{it.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          <MenuRow label="Галерея" onPress={() => go('gallery')} />
          <MenuRow label="Вопросы" onPress={() => go('contacts')} />
          <MenuRow label="Контакты" onPress={() => go('contacts')} noBorder />
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
});
