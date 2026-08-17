// Карта развития одного ребёнка.
// Общий компонент: воспитатель открывает её из своего раздела и заполняет
// (editable), родитель — из кабинета и только просматривает.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import AppIcon from './AppIcon';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { StudentLite } from '../api';
import { DevCardView, fetchDevCard, saveDevCard } from '../devcards';

const LEVEL_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  formed: { bg: '#E1F5EE', border: '#1D9E75', color: '#0F6E56' },
  partial: { bg: '#FAEEDA', border: '#EF9F27', color: '#854F0B' },
  not_formed: { bg: '#FCEBEB', border: '#E06767', color: '#a23a3a' },
};

export default function DevCard({
  student,
  editable,
  onBack,
}: {
  student: StudentLite;
  editable: boolean;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const { token } = useAuth();

  const [ageGroup, setAgeGroup] = useState('kishi');
  const [view, setView] = useState<DevCardView | null>(null);
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(
    async (group: string) => {
      if (!token) return;
      setLoading(true);
      setMsg('');
      const data = await fetchDevCard(student.id, group, token);
      setView(data);
      setMarks(data?.card?.marks ? { ...data.card.marks } : {});
      setPeriod(data?.card?.period || '');
      setLoading(false);
    },
    [student.id, token],
  );

  useEffect(() => {
    load(ageGroup);
  }, [ageGroup, load]);

  // Повторное нажатие по выбранному уровню снимает отметку.
  const pick = (no: number, level: string) => {
    if (!editable) return;
    setMsg('');
    setMarks((prev) => {
      const next = { ...prev };
      if (next[no] === level) delete next[no];
      else next[String(no)] = level;
      return next;
    });
  };

  const save = async () => {
    if (!token) return;
    setSaving(true);
    const res = await saveDevCard(student.id, { age_group: ageGroup, period, marks }, token);
    setSaving(false);
    setMsg(res.ok ? t('dev.saved') : res.error === 'network' ? t('login.err_network') : res.error || t('dev.save_err'));
  };

  const total = view?.catalog ? view.catalog.areas.reduce((n, a) => n + a.skills.length, 0) : 0;
  const filled = Object.keys(marks).length;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={10} style={{ padding: 4 }}>
          <AppIcon name="arrow-left" size={20} color={colors.primaryDark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topName} numberOfLines={1}>
            {student.firstname} {student.surname}
          </Text>
          <Text style={styles.topSub}>
            {t('dev.progress')}: {filled}/{total}
          </Text>
        </View>
      </View>

      {/* возрастные группы */}
      <View style={styles.chips}>
        {(view?.ageGroups || []).map((g) => {
          const on = g.key === ageGroup;
          return (
            <TouchableOpacity
              key={g.key}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => setAgeGroup(g.key)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{g.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : !view?.catalog ? (
        <Text style={styles.empty}>{t('dev.load_err')}</Text>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          {editable ? (
            <View style={styles.periodBox}>
              <Text style={styles.periodLabel}>{t('dev.period')}</Text>
              <TextInput
                style={styles.periodInput}
                value={period}
                onChangeText={(v) => {
                  setPeriod(v);
                  setMsg('');
                }}
                placeholder={t('dev.period_ph')}
                placeholderTextColor="#c4a99b"
              />
            </View>
          ) : (
            !!period && (
              <Text style={styles.periodRead}>
                {t('dev.period')}: {period}
              </Text>
            )
          )}

          {view.catalog.areas.map((area) => (
            <View key={area.key} style={styles.area}>
              <Text style={styles.areaTitle}>{area.label}</Text>
              {area.skills.map((sk) => {
                const current = marks[sk.no];
                return (
                  <View key={sk.no} style={styles.skill}>
                    <View style={styles.skillHead}>
                      <View style={styles.skillNo}>
                        <Text style={styles.skillNoText}>{sk.no}</Text>
                      </View>
                      <Text style={styles.skillText}>{sk.text}</Text>
                    </View>
                    <View style={styles.levels}>
                      {(view.levels || []).map((lv) => {
                        const on = current === lv.key;
                        const st = LEVEL_STYLE[lv.key];
                        return (
                          <TouchableOpacity
                            key={lv.key}
                            style={[
                              styles.level,
                              on && { backgroundColor: st.bg, borderColor: st.border },
                              !editable && !on && { opacity: 0.45 },
                            ]}
                            onPress={() => pick(sk.no, lv.key)}
                            activeOpacity={editable ? 0.7 : 1}
                          >
                            <Text style={[styles.levelText, on && { color: st.color }]}>{lv.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {!!msg && <Text style={styles.msg}>{msg}</Text>}

          {editable ? (
            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t('dev.save')}</Text>}
            </TouchableOpacity>
          ) : (
            <Text style={styles.readonly}>{t('dev.readonly')}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  empty: { fontSize: 13.5, color: colors.muted, textAlign: 'center', marginTop: 36, fontFamily: 'Nunito_600SemiBold' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topName: { fontSize: 15.5, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  topSub: { fontSize: 11.5, color: colors.muted, marginTop: 1, fontFamily: 'Nunito_600SemiBold' },

  chips: { flexDirection: 'row', gap: 7, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 2 },
  chip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },
  chipTextOn: { color: '#fff' },

  periodBox: { marginBottom: 14 },
  periodLabel: { fontSize: 12, fontWeight: '800', color: colors.primaryDark, marginBottom: 6, fontFamily: 'Nunito_800ExtraBold' },
  periodInput: {
    borderWidth: 1.5,
    borderColor: '#e6d3c8',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.white,
    fontFamily: 'Nunito_600SemiBold',
  },
  periodRead: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 12,
    fontFamily: 'Nunito_800ExtraBold',
  },

  area: { marginBottom: 14 },
  areaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
    backgroundColor: '#FAEEDA',
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 13,
    marginBottom: 8,
    fontFamily: 'Nunito_800ExtraBold',
  },
  skill: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  skillHead: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  skillNo: { width: 23, height: 23, borderRadius: 12, backgroundColor: '#f6ece6', alignItems: 'center', justifyContent: 'center' },
  skillNoText: { fontSize: 11, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },
  skillText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#4a3b33', fontFamily: 'Nunito_600SemiBold' },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  level: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 11,
    backgroundColor: colors.white,
  },
  levelText: { fontSize: 11.5, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },

  msg: { fontSize: 13, fontWeight: '800', color: '#1D9E75', textAlign: 'center', marginTop: 8, fontFamily: 'Nunito_800ExtraBold' },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
  readonly: {
    fontSize: 12.5,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    fontFamily: 'Nunito_600SemiBold',
  },
});
