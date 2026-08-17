import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AppIcon from '../components/AppIcon';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import {
  DailyReport,
  Menu,
  Mood,
  PersonLite,
  Photo,
  RoutineItem,
  MEAL_KEYS,
  emptyMenu,
  deletePhoto,
  fetchGroupReports,
  fetchMenu,
  fetchPhotos,
  fetchRoutine,
  photoUrl,
  saveReport,
  todayISO,
  uploadPhoto,
} from '../daycare';

type Tab = 'routine' | 'menu' | 'reports' | 'photos';

const MOOD_LIST: { key: Mood; emoji: string; tKey: string }[] = [
  { key: 'happy', emoji: '😊', tKey: 'mood.happy' },
  { key: 'calm', emoji: '🙂', tKey: 'mood.calm' },
  { key: 'sad', emoji: '😕', tKey: 'mood.sad' },
  { key: 'sick', emoji: '🤒', tKey: 'mood.sick' },
];

export default function TutorDayScreen() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('reports');

  const TABS: { key: Tab; tKey: string; icon: string }[] = [
    { key: 'reports', tKey: 'day.tab_reports', icon: 'heart' },
    { key: 'menu', tKey: 'day.tab_menu', icon: 'soup' },
    { key: 'routine', tKey: 'day.tab_routine', icon: 'clock' },
    { key: 'photos', tKey: 'day.tab_photos', icon: 'photo' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabs}>
        {TABS.map((x) => {
          const on = x.key === tab;
          return (
            <TouchableOpacity key={x.key} style={[styles.tab, on && styles.tabOn]} onPress={() => setTab(x.key)}>
              <AppIcon name={x.icon} size={16} color={on ? '#fff' : colors.muted} />
              <Text style={[styles.tabText, on && { color: '#fff' }]} numberOfLines={1}>
                {t(x.tKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'reports' && <Reports />}
      {tab === 'menu' && <MenuEditor />}
      {tab === 'routine' && <RoutineEditor />}
      {tab === 'photos' && <Photos />}
    </View>
  );
}

/* ------------------- Күнделікті есеп: көңіл-күй, ұйқы, тамақ ------------------- */

function Reports() {
  const { t } = useI18n();
  const { token } = useAuth();
  const date = todayISO();
  const [rows, setRows] = useState<{ student: PersonLite; report: DailyReport | null }[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setRows(await fetchGroupReports(date, token));
  }, [token, date]);

  useEffect(() => {
    load();
  }, [load]);

  if (!rows) return <ActivityIndicator color={colors.primary} style={{ marginTop: 36 }} />;
  if (!rows.length) return <Text style={styles.empty}>{t('day.no_children')}</Text>;

  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.hint}>{t('day.reports_hint')}</Text>
      {rows.map((r) => (
        <ReportCard
          key={r.student.id}
          student={r.student}
          report={r.report}
          date={date}
          open={openId === r.student.id}
          onToggle={() => setOpenId(openId === r.student.id ? null : r.student.id)}
          onSaved={load}
        />
      ))}
    </ScrollView>
  );
}

function ReportCard({
  student,
  report,
  date,
  open,
  onToggle,
  onSaved,
}: {
  student: PersonLite;
  report: DailyReport | null;
  date: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { token } = useAuth();
  const [mood, setMood] = useState<Mood>(report?.mood || '');
  const [sleep, setSleep] = useState(String(report?.sleep_minutes ?? ''));
  const [eaten, setEaten] = useState(report?.meals_eaten ?? 0);
  const [total, setTotal] = useState(report?.meals_total ?? 3);
  const [note, setNote] = useState(report?.note || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    if (!token) return;
    setSaving(true);
    const res = await saveReport(
      { student_id: student.id, date, mood, sleep_minutes: Number(sleep) || 0, meals_eaten: eaten, meals_total: total, note },
      token,
    );
    setSaving(false);
    setMsg(res ? t('day.saved') : t('day.save_err'));
    if (res) onSaved();
  };

  const filled = !!report && (!!report.mood || report.sleep_minutes > 0 || report.meals_eaten > 0);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHead} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.dot, filled && { backgroundColor: '#1D9E75' }]} />
        <Text style={styles.kidName}>
          {student.firstname} {student.surname}
        </Text>
        <Text style={styles.kidState}>
          {filled ? MOOD_LIST.find((m) => m.key === report?.mood)?.emoji || '✓' : t('day.not_filled')}
        </Text>
        <AppIcon name={open ? 'chevron-down' : 'chevron-right'} size={16} color={colors.navInactive} />
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <Text style={styles.label}>{t('home.mood')}</Text>
          <View style={styles.moodRow}>
            {MOOD_LIST.map((m) => {
              const on = mood === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.mood, on && styles.moodOn]}
                  onPress={() => setMood(on ? '' : m.key)}
                >
                  <Text style={{ fontSize: 19 }}>{m.emoji}</Text>
                  <Text style={[styles.moodText, on && { color: colors.primaryDark }]}>{t(m.tKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.grid}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('day.sleep_min')}</Text>
              <TextInput style={styles.input} value={sleep} onChangeText={setSleep} keyboardType="number-pad" placeholder="100" placeholderTextColor="#c4a99b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('day.meals')}</Text>
              <View style={styles.counter}>
                <TouchableOpacity style={styles.cbtn} onPress={() => setEaten(Math.max(0, eaten - 1))}>
                  <Text style={styles.cbtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.cval}>{eaten} / {total}</Text>
                <TouchableOpacity style={styles.cbtn} onPress={() => setEaten(Math.min(total, eaten + 1))}>
                  <Text style={styles.cbtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.label}>{t('day.note')}</Text>
          <TextInput
            style={[styles.input, { height: 66, textAlignVertical: 'top' }]}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder={t('day.note_ph')}
            placeholderTextColor="#c4a99b"
          />

          {!!msg && <Text style={styles.msg}>{msg}</Text>}
          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t('day.save')}</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ------------------------------- Ас мәзірі ------------------------------- */

// Мәзірді әкімші толтырады — тәрбиеші тек көреді.
function MenuEditor() {
  const { t } = useI18n();
  const { token } = useAuth();
  const date = todayISO();
  const [menu, setMenu] = useState<Menu>(emptyMenu());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchMenu(date, token).then((m) => {
      setMenu(m);
      setLoading(false);
    });
  }, [token, date]);

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 36 }} />;

  const filled = MEAL_KEYS.some((k) => (menu[k] || '').trim());

  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 28 }}>
      <Text style={styles.hint}>{t('day.menu_readonly')}</Text>
      {!filled ? (
        <Text style={styles.empty}>{t('day.menu_empty')}</Text>
      ) : (
        <View style={styles.viewCard}>
          {MEAL_KEYS.map((k) => (
            <View key={k} style={styles.viewRow}>
              <Text style={styles.viewLabel}>{t('menu.' + k)}</Text>
              <Text style={styles.viewValue}>{menu[k] || '—'}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* ------------------------------ Күн тәртібі ------------------------------ */

// Күн тәртібін әкімші толтырады — тәрбиеші тек көреді.
function RoutineEditor() {
  const { t } = useI18n();
  const { token } = useAuth();
  const [items, setItems] = useState<RoutineItem[] | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchRoutine(token).then(setItems);
  }, [token]);

  if (!items) return <ActivityIndicator color={colors.primary} style={{ marginTop: 36 }} />;

  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 28 }}>
      <Text style={styles.hint}>{t('day.routine_readonly')}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>{t('day.routine_empty')}</Text>
      ) : (
        <View style={styles.viewCard}>
          {items.map((it, i) => (
            <View key={i} style={styles.routineRow}>
              <Text style={styles.routineTime}>{it.time || '—'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineTitle}>{it.title}</Text>
                {!!it.subtitle && <Text style={styles.routineSub}>{it.subtitle}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* -------------------------------- Суреттер -------------------------------- */

function Photos() {
  const { t } = useI18n();
  const { token } = useAuth();
  const date = todayISO();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setPhotos(await fetchPhotos(date, token));
  }, [token, date]);

  useEffect(() => {
    load();
  }, [load]);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('day.photo_perm'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]?.base64 || !token) return;

    setBusy(true);
    const asset = res.assets[0];
    const uploaded = await uploadPhoto(`data:image/jpeg;base64,${asset.base64}`, date, '', token);
    setBusy(false);
    if (uploaded) load();
    else Alert.alert(t('day.photo_err'));
  };

  const remove = (id: number) => {
    Alert.alert(t('day.photo_delete_q'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('day.remove'),
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          await deletePhoto(id, token);
          load();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 28 }}>
      <Text style={styles.hint}>{t('day.photos_hint')}</Text>

      <TouchableOpacity style={styles.uploadBtn} onPress={pick} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t('day.add_photo')}</Text>}
      </TouchableOpacity>

      {photos === null ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : photos.length === 0 ? (
        <Text style={styles.empty}>{t('home.photos_empty')}</Text>
      ) : (
        <View style={styles.photoGrid}>
          {photos.map((p) => (
            <TouchableOpacity key={p.id} onLongPress={() => remove(p.id)} activeOpacity={0.85}>
              <Image source={{ uri: photoUrl(p.url) }} style={styles.photo} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      {!!photos?.length && <Text style={styles.hintSmall}>{t('day.photo_longpress')}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 12, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.border,
  },
  tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },

  body: { flex: 1, paddingHorizontal: 14, paddingTop: 6 },
  hint: { fontSize: 12.5, color: colors.muted, marginBottom: 14, lineHeight: 18, fontFamily: 'Nunito_600SemiBold' },
  hintSmall: { fontSize: 11.5, color: colors.muted, marginTop: 10, textAlign: 'center', fontFamily: 'Nunito_600SemiBold' },
  empty: { fontSize: 13.5, color: colors.muted, textAlign: 'center', marginTop: 30, fontFamily: 'Nunito_600SemiBold' },

  card: { backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 10, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#e0cabd' },
  kidName: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  kidState: { fontSize: 12, color: colors.muted, fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  cardBody: { padding: 13, paddingTop: 0 },

  label: { fontSize: 11.5, fontWeight: '800', color: colors.primaryDark, marginBottom: 6, marginTop: 8, fontFamily: 'Nunito_800ExtraBold' },
  input: {
    borderWidth: 1.5, borderColor: '#e6d3c8', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13.5, color: colors.text, backgroundColor: '#FFFBF9', fontFamily: 'Nunito_600SemiBold',
  },
  grid: { flexDirection: 'row', gap: 10 },

  moodRow: { flexDirection: 'row', gap: 6 },
  mood: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 9, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  moodOn: { borderColor: colors.primary, backgroundColor: '#FFF7F3' },
  moodText: { fontSize: 10, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },

  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#e6d3c8', borderRadius: 11, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: '#FFFBF9' },
  cbtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.heroBg },
  cbtnText: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  cval: { fontSize: 14, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },

  routineCard: { backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 13, marginBottom: 10 },

  // Просмотр (мәзір/күн тәртібі заполняет админ)
  viewCard: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15 },
  viewRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  viewLabel: { fontSize: 12.5, color: colors.muted, fontWeight: '700', width: 110, fontFamily: 'Nunito_700Bold' },
  viewValue: { flex: 1, fontSize: 13.5, color: colors.text, fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  routineRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  routineTime: { width: 54, fontSize: 12.5, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },
  routineTitle: { fontSize: 13.5, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  routineSub: { fontSize: 11.5, color: colors.muted, marginTop: 1, fontFamily: 'Nunito_600SemiBold' },
  removeText: { fontSize: 12, fontWeight: '800', color: '#c0392b', marginTop: 10, fontFamily: 'Nunito_800ExtraBold' },
  addBtn: { borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, paddingVertical: 13, alignItems: 'center', marginBottom: 14 },
  addText: { fontSize: 13.5, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },

  msg: { fontSize: 13, fontWeight: '800', color: '#1D9E75', textAlign: 'center', marginTop: 10, fontFamily: 'Nunito_800ExtraBold' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  uploadBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  saveText: { color: '#fff', fontSize: 14.5, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  photo: { width: 104, height: 104, borderRadius: 13, backgroundColor: colors.heroBg },
});
