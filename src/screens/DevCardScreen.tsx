import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import AppIcon from '../components/AppIcon';
import DevCard from '../components/DevCard';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { fetchProfile, StudentLite } from '../api';

// Раздел воспитателя: дети своей группы → карта развития каждого.
export default function DevCardScreen() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const isTutor = user?.role === 'tutor';

  const [students, setStudents] = useState<StudentLite[] | null>(null);
  const [selected, setSelected] = useState<StudentLite | null>(null);

  // Сервер сам ограничивает выборку: воспитателю — его группа, родителю — его дети.
  useEffect(() => {
    if (!user || !token) return;
    if (user.role !== 'tutor' && user.role !== 'parent') return setStudents([]);
    fetchProfile(user.role, token).then((res) => {
      if (!res.ok || !res.data) return setStudents([]);
      setStudents(user.role === 'tutor' ? res.data.group?.students || [] : res.data.students || []);
    });
  }, [user, token]);

  if (selected) {
    return <DevCard student={selected} editable={!!isTutor} onBack={() => setSelected(null)} />;
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.screenTitle}>{t('dev.title')}</Text>
      <Text style={styles.screenHint}>{isTutor ? t('dev.hint_tutor') : t('dev.hint_parent')}</Text>

      {students === null && <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />}
      {students?.length === 0 && <Text style={styles.empty}>{t('dev.no_children')}</Text>}

      {students?.map((s, idx) => (
        <TouchableOpacity
          key={s.id}
          style={[styles.kid, idx === students.length - 1 && { marginBottom: 0 }]}
          onPress={() => setSelected(s)}
          activeOpacity={0.85}
        >
          <View style={styles.kidIcon}>
            <AppIcon name="account-child" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kidName}>
              {s.firstname} {s.surname}
            </Text>
            <Text style={styles.kidSub}>{t('dev.open_card')}</Text>
          </View>
          <AppIcon name="chevron-right" size={18} color={colors.navInactive} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  screenTitle: { fontSize: 17, fontWeight: '800', color: colors.primaryDark, marginTop: 8, fontFamily: 'Nunito_800ExtraBold' },
  screenHint: { fontSize: 12.5, color: colors.muted, marginTop: 4, marginBottom: 16, lineHeight: 18, fontFamily: 'Nunito_600SemiBold' },
  empty: { fontSize: 13.5, color: colors.muted, textAlign: 'center', marginTop: 36, fontFamily: 'Nunito_600SemiBold' },

  kid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  kidIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#FBEAF0', alignItems: 'center', justifyContent: 'center' },
  kidName: { fontSize: 15, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  kidSub: { fontSize: 12, color: colors.muted, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
});
