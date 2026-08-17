import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { Lesson, StudentLite, fetchGroup, fetchAttendance, markAttendanceBulk } from '../api';

export default function AttendanceSheet({
  visible,
  lesson,
  date,
  token,
  onClose,
}: {
  visible: boolean;
  lesson: Lesson | null;
  date: string;
  token: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [present, setPresent] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (!visible || !lesson) return;
    setLoading(true);
    setSaved('');
    (async () => {
      const [group, att] = await Promise.all([
        fetchGroup(lesson.group_id, token),
        fetchAttendance(lesson.id, date, token),
      ]);
      const list = group?.students || [];
      const map: Record<number, boolean> = {};
      list.forEach((s) => (map[s.id] = true)); // по умолчанию — присутствует
      att.forEach((a) => (map[a.student_id] = a.present)); // уже отмеченные
      setStudents(list);
      setPresent(map);
      setLoading(false);
    })();
  }, [visible, lesson, date, token]);

  const toggle = (id: number, value: boolean) => {
    setPresent((p) => ({ ...p, [id]: value }));
    setSaved('');
  };

  const save = async () => {
    if (!lesson) return;
    setSaving(true);
    const records = students.map((s) => ({ student_id: s.id, present: present[s.id] !== false }));
    const ok = await markAttendanceBulk(lesson.id, date, records, token);
    setSaving(false);
    setSaved(ok ? t('att.saved') : t('att.save_err'));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('att.title')}</Text>
          {!!lesson && (
            <Text style={styles.subtitle}>
              {lesson.subject} · {date} · {lesson.start_time}–{lesson.end_time}
            </Text>
          )}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
          ) : students.length === 0 ? (
            <Text style={styles.empty}>{t('att.no_students')}</Text>
          ) : (
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {students.map((s) => {
                const isPresent = present[s.id] !== false;
                return (
                  <View key={s.id} style={styles.row}>
                    <Text style={styles.name}>
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
            </ScrollView>
          )}

          {!!saved && <Text style={styles.savedMsg}>{saved}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.save, (loading || students.length === 0) && { opacity: 0.5 }]}
              onPress={save}
              disabled={saving || loading || students.length === 0}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t('att.save')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '88%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#eaddd5', marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  subtitle: { fontSize: 12.5, color: colors.muted, marginTop: 4, marginBottom: 16, fontFamily: 'Nunito_600SemiBold' },
  empty: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 24, fontFamily: 'Nunito_600SemiBold' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  name: { flex: 1, fontSize: 14, fontWeight: '700', color: '#4a3b33', fontFamily: 'Nunito_700Bold' },
  seg: { flexDirection: 'row', backgroundColor: '#f6ece6', borderRadius: 12, padding: 3 },
  segBtn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 9 },
  segOnPresent: { backgroundColor: '#1D9E75' },
  segOnAbsent: { backgroundColor: '#D4537E' },
  segText: { fontSize: 12, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },
  segTextOn: { color: '#fff' },

  savedMsg: { fontSize: 13, fontWeight: '800', color: '#1D9E75', marginTop: 12, textAlign: 'center', fontFamily: 'Nunito_800ExtraBold' },

  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancel: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border },
  cancelText: { fontSize: 14, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },
  save: { flex: 1.4, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, backgroundColor: colors.primary },
  saveText: { fontSize: 14, fontWeight: '800', color: '#fff', fontFamily: 'Nunito_800ExtraBold' },
});
