// Күн тәртібі тобы — распорядок дня и меню на сегодня.
// Заполняет воспитатель (в своём разделе «Күн» или в админ-панели),
// здесь показываем в удобном для родителя виде.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { HomeData, MEAL_KEYS, fetchHome, todayISO } from '../daycare';

export default function RoutineScreen() {
  const { t } = useI18n();
  const { token } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setData(await fetchHome(token, todayISO()));
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!data || !data.group) {
    return <Text style={styles.empty}>{t('home.no_group')}</Text>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Text style={styles.groupName}>{data.group.name}</Text>

      {/* Күн тәртібі */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <AppIcon name="clock" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>{t('home.routine')}</Text>
        </View>
        {data.routine.length === 0 ? (
          <Text style={styles.cardEmpty}>{t('routine.empty')}</Text>
        ) : (
          data.routine.map((r, i) => (
            <View key={r.id ?? i} style={[styles.routineRow, i === data.routine.length - 1 && styles.lastRow]}>
              <Text style={styles.routineTime}>{r.time || '—'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineTitle}>{r.title}</Text>
                {!!r.subtitle && <Text style={styles.routineSub}>{r.subtitle}</Text>}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Ас мәзірі — 5 тамақ */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <AppIcon name="soup" size={18} color="#1D9E75" />
          <Text style={styles.cardTitle}>{t('home.menu_today')}</Text>
        </View>
        {MEAL_KEYS.map((key, i) => (
          <View key={key} style={[styles.mealRow, i === MEAL_KEYS.length - 1 && styles.lastRow]}>
            <Text style={styles.mealLabel}>{t(`menu.${key}`)}</Text>
            <Text style={styles.mealValue}>{data.menu[key] || '—'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    textAlign: 'center', marginTop: 50, color: colors.muted, fontSize: 14,
    paddingHorizontal: 30, lineHeight: 20, fontFamily: 'Nunito_600SemiBold',
  },

  groupName: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 12, marginBottom: 4, fontFamily: 'Nunito_700Bold' },

  card: {
    backgroundColor: colors.white, borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, padding: 15, marginTop: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 14.5, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  cardEmpty: { fontSize: 12.5, color: colors.muted, paddingVertical: 6, fontFamily: 'Nunito_600SemiBold' },

  routineRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  routineTime: { width: 52, fontSize: 12.5, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },
  routineTitle: { fontSize: 13.5, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  routineSub: { fontSize: 11.5, color: colors.muted, marginTop: 1, fontFamily: 'Nunito_600SemiBold' },

  mealRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  mealLabel: { width: 108, fontSize: 12.5, color: colors.muted, fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  mealValue: { flex: 1, fontSize: 13.5, color: colors.text, fontWeight: '700', fontFamily: 'Nunito_700Bold' },

  lastRow: { borderBottomWidth: 0 },
});
