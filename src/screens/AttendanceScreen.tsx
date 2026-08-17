import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import AppIcon from '../components/AppIcon';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import {
  Lesson,
  StudentLite,
  fetchAttendance,
  fetchMyLessons,
  fetchProfile,
  markAttendanceBulk,
} from '../api';

// YYYY-MM-DD в местном времени (без сдвига часового пояса).
function isoOf(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Урокам соответствует 1=Пн … 6=Сб; воскресенье (0) занятий не имеет.
const weekdayOf = (d: Date) => d.getDay();

export default function AttendanceScreen() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const isTutor = user?.role === 'tutor';

  const [date, setDate] = useState<Date>(new Date());
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [present, setPresent] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const iso = isoOf(date);

  // Расписание своей группы и состав группы — загружаем один раз.
  useEffect(() => {
    if (!token || !user) return;
    (async () => {
      const [ls, profile] = await Promise.all([
        fetchMyLessons(token),
        fetchProfile(user.role === 'tutor' ? 'tutor' : 'parent', token),
      ]);
      setLessons(ls);
      setStudents(profile.data?.group?.students || []);
    })();
  }, [token, user]);

  const dayLessons = useMemo(
    () => (lessons || []).filter((l) => l.weekday === weekdayOf(date)).sort((a, b) => a.order_no - b.order_no),
    [lessons, date],
  );

  // При смене дня/урока подтягиваем уже проставленные отметки.
  const loadMarks = useCallback(
    async (lid: number | null) => {
      if (!token) return;
      setLoading(true);
      setMsg('');
      const map: Record<number, boolean> = {};
      students.forEach((s) => (map[s.id] = true)); // по умолчанию «пришёл»
      if (lid) {
        const rows = await fetchAttendance(lid, iso, token);
        rows.forEach((r) => (map[r.student_id] = r.present));
      }
      setPresent(map);
      setLoading(false);
    },
    [token, iso, students],
  );

  useEffect(() => {
    if (lessons === null) return;
    const next = dayLessons.some((l) => l.id === lessonId) ? lessonId : dayLessons[0]?.id ?? null;
    setLessonId(next);
    loadMarks(next);
  }, [dayLessons, lessons, loadMarks]); // eslint-disable-line react-hooks/exhaustive-deps

  const shiftDay = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d);
  };

  const toggle = (id: number, value: boolean) => {
    setPresent((p) => ({ ...p, [id]: value }));
    setMsg('');
  };

  const setAll = (value: boolean) => {
    const map: Record<number, boolean> = {};
    students.forEach((s) => (map[s.id] = value));
    setPresent(map);
    setMsg('');
  };

  const save = async () => {
    if (!token || !lessonId) return;
    setSaving(true);
    const records = students.map((s) => ({ student_id: s.id, present: present[s.id] !== false }));
    const ok = await markAttendanceBulk(lessonId, iso, records, token);
    setSaving(false);
    setMsg(ok ? t('att.saved') : t('att.save_err'));
  };

  const nPresent = students.filter((s) => present[s.id] !== false).length;
  const isToday = iso === isoOf(new Date());

  if (!isTutor) {
    return <Text style={styles.empty}>{t('att.tutor_only')}</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* выбор даты */}
      <View style={styles.dateBar}>
        <TouchableOpacity style={styles.arrow} onPress={() => shiftDay(-1)} hitSlop={8}>
          <AppIcon name="arrow-left" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setDate(new Date())}>
          <Text style={styles.dateText}>
            {date.toLocaleDateString([], { day: '2-digit', month: 'long' })}
          </Text>
          <Text style={styles.dateSub}>
            {t(`wd.${weekdayOf(date) === 0 ? 7 : weekdayOf(date)}`)}
            {isToday ? ` · ${t('att.today')}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.arrow} onPress={() => shiftDay(1)} hitSlop={8}>
          <View style={{ transform: [{ scaleX: -1 }] }}>
            <AppIcon name="arrow-left" size={18} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {lessons === null ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : dayLessons.length === 0 ? (
        <Text style={styles.empty}>{t('att.no_lessons')}</Text>
      ) : (
        <>
          {/* выбор урока */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lessonsRow} contentContainerStyle={{ gap: 7, paddingHorizontal: 14 }}>
            {dayLessons.map((l) => {
              const on = l.id === lessonId;
              return (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.lesson, on && styles.lessonOn]}
                  onPress={() => {
                    setLessonId(l.id);
                    loadMarks(l.id);
                  }}
                >
                  <Text style={[styles.lessonSubject, on && { color: '#fff' }]} numberOfLines={1}>
                    {l.order_no}. {l.subject}
                  </Text>
                  <Text style={[styles.lessonTime, on && { color: 'rgba(255,255,255,0.85)' }]}>
                    {l.start_time}–{l.end_time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* сводка + «отметить всех» */}
          <View style={styles.summary}>
            <View style={[styles.sumBox, { backgroundColor: '#E1F5EE' }]}>
              <Text style={[styles.sumText, { color: '#0F6E56' }]}>
                {t('att.present')}: {nPresent}
              </Text>
            </View>
            <View style={[styles.sumBox, { backgroundColor: '#FCEBEB' }]}>
              <Text style={[styles.sumText, { color: '#a23a3a' }]}>
                {t('att.absent')}: {students.length - nPresent}
              </Text>
            </View>
            <TouchableOpacity style={styles.allBtn} onPress={() => setAll(true)}>
              <Text style={styles.allText}>{t('att.all_present')}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
          ) : students.length === 0 ? (
            <Text style={styles.empty}>{t('att.no_students')}</Text>
          ) : (
            <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 26 }} showsVerticalScrollIndicator={false}>
              {students.map((s) => {
                const isPresent = present[s.id] !== false;
                return (
                  <View key={s.id} style={styles.row}>
                    <View style={styles.rowIcon}>
                      <AppIcon name="account-child" size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.name} numberOfLines={1}>
                      {s.firstname} {s.surname}
                    </Text>
                    <View style={styles.seg}>
                      <TouchableOpacity
                        style={[styles.segBtn, isPresent && styles.segOnPresent]}
                        onPress={() => toggle(s.id, true)}
                      >
                        <Text style={[styles.segText, isPresent && styles.segTextOn]}>{t('att.present')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segBtn, !isPresent && styles.segOnAbsent]}
                        onPress={() => toggle(s.id, false)}
                      >
                        <Text style={[styles.segText, !isPresent && styles.segTextOn]}>{t('att.absent')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {!!msg && <Text style={styles.msg}>{msg}</Text>}

              <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving || !lessonId}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t('att.save')}</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrow: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAEEDA' },
  dateText: { fontSize: 15.5, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  dateSub: { fontSize: 11.5, color: colors.muted, marginTop: 1, fontFamily: 'Nunito_600SemiBold' },

  lessonsRow: { flexGrow: 0, paddingVertical: 10 },
  lesson: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 13,
    maxWidth: 210,
  },
  lessonOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  lessonSubject: { fontSize: 13, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  lessonTime: { fontSize: 11, color: colors.muted, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },

  summary: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 8, alignItems: 'center' },
  sumBox: { flex: 1, borderRadius: 11, paddingVertical: 8, alignItems: 'center' },
  sumText: { fontSize: 12, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
  allBtn: { borderRadius: 11, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1.5, borderColor: colors.primary },
  allText: { fontSize: 11.5, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },

  body: { flex: 1, paddingHorizontal: 14 },
  empty: { fontSize: 13.5, color: colors.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 24, lineHeight: 20, fontFamily: 'Nunito_600SemiBold' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 11,
    marginBottom: 8,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#FBEAF0', alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 13.5, fontWeight: '800', color: '#4a3b33', fontFamily: 'Nunito_800ExtraBold' },
  seg: { flexDirection: 'row', backgroundColor: '#f6ece6', borderRadius: 11, padding: 3 },
  segBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9 },
  segOnPresent: { backgroundColor: '#1D9E75' },
  segOnAbsent: { backgroundColor: '#D4537E' },
  segText: { fontSize: 11.5, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },
  segTextOn: { color: '#fff' },

  msg: { fontSize: 13, fontWeight: '800', color: '#1D9E75', textAlign: 'center', marginTop: 10, fontFamily: 'Nunito_800ExtraBold' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
});
