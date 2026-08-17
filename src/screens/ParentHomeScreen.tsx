import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { fetchContent } from '../api';
import { HomeData, MEAL_KEYS, fetchHome, photoUrl, sleepLabel, todayISO } from '../daycare';

// Настроение ребёнка: эмодзи + подпись (ключ перевода).
const MOODS: Record<string, { emoji: string; tKey: string }> = {
  happy: { emoji: '😊', tKey: 'mood.happy' },
  calm: { emoji: '🙂', tKey: 'mood.calm' },
  sad: { emoji: '😕', tKey: 'mood.sad' },
  sick: { emoji: '🤒', tKey: 'mood.sick' },
};

// Порядок блоков по умолчанию. Админ меняет его в панели («🧩 Блоктар»),
// значение приходит в разделе контента layout = { order, hidden }.
const DEFAULT_ORDER = ['report', 'menu', 'routine', 'photos', 'tutor'];

type Layout = { order: string[]; hidden: string[] };

export default function ParentHomeScreen({ onOpenChat }: { onOpenChat?: () => void }) {
  const { t } = useI18n();
  const { token } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [layout, setLayout] = useState<Layout>({ order: DEFAULT_ORDER, hidden: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const [home, content] = await Promise.all([fetchHome(token, todayISO()), fetchContent()]);
    setData(home);

    const saved = (content as { layout?: Partial<Layout> } | null)?.layout;
    const order = Array.isArray(saved?.order)
      ? saved!.order.filter((k) => DEFAULT_ORDER.includes(k))
      : [];
    setLayout({
      // блоки, которых нет в сохранённом порядке (новые), показываем в конце
      order: order.concat(DEFAULT_ORDER.filter((k) => !order.includes(k))),
      hidden: Array.isArray(saved?.hidden) ? saved!.hidden : [],
    });
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

  const report = data.report;
  const mood = report && report.mood ? MOODS[report.mood] : null;

  // Разметка каждого блока — рисуем их в порядке из настроек.
  const blocks: Record<string, React.ReactNode> = {
    report: (
      <View>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{t('home.today_label')}</Text>
          <Text style={styles.heroTitle}>
            {report ? report.note || t('home.day_ok') : t('home.no_report_yet')}
          </Text>

          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('home.mood')}</Text>
              <Text style={styles.statValue}>{mood ? `${mood.emoji} ${t(mood.tKey)}` : '—'}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('home.sleep')}</Text>
              <Text style={styles.statValue}>{report ? sleepLabel(report.sleep_minutes) : '—'}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('home.food')}</Text>
              <Text style={styles.statValue}>
                {report ? `${report.meals_eaten}/${report.meals_total}` : '—'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.heroBtn} onPress={() => setShowReport((v) => !v)}>
            <Text style={styles.heroBtnText}>
              {showReport ? t('home.hide_report') : t('home.open_report')}
            </Text>
          </TouchableOpacity>
        </View>

        {showReport && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('home.report_title')}</Text>
            <Row label={t('home.mood')} value={mood ? `${mood.emoji} ${t(mood.tKey)}` : '—'} />
            <Row label={t('home.sleep')} value={report ? sleepLabel(report.sleep_minutes) : '—'} />
            <Row
              label={t('home.food')}
              value={report ? `${report.meals_eaten} / ${report.meals_total}` : '—'}
            />
            {!!report?.note && <Row label={t('home.note')} value={report.note} />}
          </View>
        )}
      </View>
    ),

    menu: (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.menu_today')}</Text>
        {MEAL_KEYS.map((key) => (
          <Row key={key} label={t(`menu.${key}`)} value={data.menu[key] || '—'} />
        ))}
      </View>
    ),

    routine: data.routine.length > 0 && (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.routine')}</Text>
        {data.routine.map((r, i) => (
          <View key={r.id ?? i} style={styles.routineRow}>
            <Text style={styles.routineTime}>{r.time}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.routineTitle}>{r.title}</Text>
              {!!r.subtitle && <Text style={styles.routineSub}>{r.subtitle}</Text>}
            </View>
          </View>
        ))}
      </View>
    ),

    photos: (
      <View>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('home.photos')}</Text>
        </View>
        {data.photos.length === 0 ? (
          <Text style={styles.photoEmpty}>{t('home.photos_empty')}</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}
          >
            {data.photos.map((p) => (
              <Image key={p.id} source={{ uri: photoUrl(p.url) }} style={styles.photo} />
            ))}
          </ScrollView>
        )}
      </View>
    ),

    tutor: data.tutors.length > 0 && (
      <TouchableOpacity style={styles.tutorCard} onPress={onOpenChat} activeOpacity={0.85}>
        <View style={styles.tutorIcon}>
          <AppIcon name="chat" size={19} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tutorName}>
            {data.tutors[0].firstname} {data.tutors[0].surname}
          </Text>
          <Text style={styles.tutorSub}>{t('home.write_tutor')}</Text>
        </View>
        <AppIcon name="chevron-right" size={18} color={colors.navInactive} />
      </TouchableOpacity>
    ),
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      {/* приветствие */}
      <View style={styles.greetRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(data.child?.firstname || '?').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetTitle} numberOfLines={1}>
            {t('home.hello')}
            {data.child ? `, ${data.child.firstname}!` : '!'}
          </Text>
          <Text style={styles.greetSub} numberOfLines={1}>
            {data.child ? `${data.child.firstname} ${data.child.surname} · ` : ''}
            {data.group.name}
          </Text>
        </View>
      </View>

      {layout.order
        .filter((key) => !layout.hidden.includes(key))
        .map((key) => (
          <React.Fragment key={key}>{blocks[key] || null}</React.Fragment>
        ))}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: colors.muted, fontSize: 14, paddingHorizontal: 30, lineHeight: 20, fontFamily: 'Nunito_600SemiBold' },

  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 14 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.heroBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  greetTitle: { fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  greetSub: { fontSize: 12.5, color: colors.muted, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },

  hero: { backgroundColor: colors.primary, borderRadius: 22, padding: 20, marginTop: 14 },
  heroLabel: { fontSize: 10.5, letterSpacing: 1, color: 'rgba(255,255,255,0.85)', fontWeight: '800', textTransform: 'uppercase', fontFamily: 'Nunito_800ExtraBold' },
  heroTitle: { fontSize: 21, fontWeight: '800', color: '#fff', marginTop: 8, lineHeight: 27, fontFamily: 'Nunito_800ExtraBold' },
  statRow: { flexDirection: 'row', gap: 9, marginTop: 16 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: 11 },
  statLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  statValue: { fontSize: 14, color: '#fff', fontWeight: '800', marginTop: 4, fontFamily: 'Nunito_800ExtraBold' },
  heroBtn: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  heroBtnText: { fontSize: 14.5, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },

  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15, marginTop: 14 },
  cardTitle: { fontSize: 14.5, fontWeight: '800', color: colors.primaryDark, marginBottom: 10, fontFamily: 'Nunito_800ExtraBold' },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 12.5, color: colors.muted, fontWeight: '700', width: 108, fontFamily: 'Nunito_700Bold' },
  rowValue: { flex: 1, fontSize: 13.5, color: colors.text, fontWeight: '700', fontFamily: 'Nunito_700Bold' },

  routineRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  routineTime: { width: 52, fontSize: 12.5, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },
  routineTitle: { fontSize: 13.5, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  routineSub: { fontSize: 11.5, color: colors.muted, marginTop: 1, fontFamily: 'Nunito_600SemiBold' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 15.5, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  photoRow: { gap: 10, paddingRight: 8 },
  photo: { width: 108, height: 108, borderRadius: 14, backgroundColor: colors.heroBg },
  photoEmpty: { fontSize: 12.5, color: colors.muted, fontFamily: 'Nunito_600SemiBold' },

  tutorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18,
    backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  tutorIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.heroBg, alignItems: 'center', justifyContent: 'center' },
  tutorName: { fontSize: 14, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  tutorSub: { fontSize: 11.5, color: colors.muted, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
});
