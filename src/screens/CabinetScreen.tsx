import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import AppIcon from '../components/AppIcon';
import DevCard from '../components/DevCard';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { fetchProfile, Profile, StudentLite } from '../api';

type State =
  | { status: 'loading' }
  | { status: 'network' }
  | { status: 'noprofile' }
  | { status: 'ok'; data: Profile };

export default function CabinetScreen() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const [state, setState] = useState<State>({ status: 'loading' });
  // Ребёнок, чью карту развития открыли из списка.
  const [cardFor, setCardFor] = useState<StudentLite | null>(null);

  const isTutor = user?.role === 'tutor';

  const load = useCallback(async () => {
    if (!user || !token) return;
    if (user.role !== 'tutor' && user.role !== 'parent') {
      setState({ status: 'noprofile' });
      return;
    }
    setState({ status: 'loading' });
    const res = await fetchProfile(user.role, token);
    if (res.ok && res.data) setState({ status: 'ok', data: res.data });
    else if (res.status === 404) setState({ status: 'noprofile' });
    else setState({ status: 'network' });
  }, [user, token]);

  useEffect(() => {
    load();
  }, [load]);

  // Список детей: для родителя — его дети, для воспитателя — дети его группы.
  const students: StudentLite[] =
    state.status === 'ok'
      ? isTutor
        ? state.data.group?.students || []
        : state.data.students || []
      : [];

  const groupName =
    state.status === 'ok' ? (isTutor ? state.data.group?.name : state.data.group?.name) : undefined;

  // Родитель открывает карту только для просмотра, воспитатель — с заполнением.
  if (cardFor) {
    return <DevCard student={cardFor} editable={!!isTutor} onBack={() => setCardFor(null)} />;
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      {/* приветствие */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <AppIcon name={isTutor ? 'school' : 'account'} size={26} color="#fff" />
        </View>
        <Text style={styles.heroName}>
          {state.status === 'ok' ? `${state.data.firstname} ${state.data.surname}` : user?.phone_number}
        </Text>
        <Text style={styles.heroRole}>{isTutor ? t('login.role_tutor') : t('login.role_parent')}</Text>
      </View>

      {state.status === 'loading' && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
      )}

      {state.status === 'network' && (
        <View style={styles.msgBox}>
          <Text style={styles.msgText}>{t('cabinet.error_network')}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>{t('cabinet.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {state.status === 'noprofile' && (
        <View style={styles.msgBox}>
          <Text style={styles.msgText}>{t('cabinet.no_profile')}</Text>
        </View>
      )}

      {state.status === 'ok' && (
        <>
          {/* группа */}
          <View style={styles.groupCard}>
            <AppIcon name="users" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.groupLabel}>{t('cabinet.group')}</Text>
              <Text style={styles.groupName}>{groupName || t('cabinet.no_group')}</Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{students.length}</Text>
            </View>
          </View>

          {/* дети */}
          <Text style={styles.sectionTitle}>{isTutor ? t('cabinet.tutor_title') : t('cabinet.parent_title')}</Text>
          {students.length === 0 ? (
            <Text style={styles.empty}>{isTutor ? t('cabinet.empty_group_children') : t('cabinet.empty_children')}</Text>
          ) : (
            students.map((s, idx) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.row, idx === students.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setCardFor(s)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIcon}>
                  <AppIcon name="account-child" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{s.firstname} {s.surname}</Text>
                  <Text style={styles.rowSub}>{t('dev.open_card')}</Text>
                </View>
                <AppIcon name="chevron-right" size={17} color={colors.navInactive} />
              </TouchableOpacity>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 6 },
  hero: { backgroundColor: colors.heroBg, borderRadius: 22, padding: 22, alignItems: 'center', marginBottom: 16, marginTop: 6 },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#ED7A4E',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  heroName: { fontSize: 17, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  heroRole: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 3, fontFamily: 'Nunito_700Bold' },

  groupCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 15, marginBottom: 18,
  },
  groupLabel: { fontSize: 11, fontWeight: '600', color: colors.muted, fontFamily: 'Nunito_600SemiBold' },
  groupName: { fontSize: 15, fontWeight: '800', color: colors.primaryDark, marginTop: 2, fontFamily: 'Nunito_800ExtraBold' },
  countPill: { minWidth: 30, height: 30, borderRadius: 15, backgroundColor: '#FAEEDA', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { fontSize: 14, fontWeight: '800', color: '#854F0B', fontFamily: 'Nunito_800ExtraBold' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginBottom: 10, fontFamily: 'Nunito_800ExtraBold' },
  empty: { fontSize: 13, color: colors.muted, fontFamily: 'Nunito_600SemiBold', paddingVertical: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FBEAF0', alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: 14, fontWeight: '700', color: '#4a3b33', fontFamily: 'Nunito_700Bold' },
  rowSub: { fontSize: 11.5, color: colors.muted, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },

  msgBox: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', marginTop: 10 },
  msgText: { fontSize: 13.5, color: colors.text, textAlign: 'center', lineHeight: 20, fontFamily: 'Nunito_600SemiBold' },
  retry: { marginTop: 14, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 13, fontFamily: 'Nunito_800ExtraBold' },
});
