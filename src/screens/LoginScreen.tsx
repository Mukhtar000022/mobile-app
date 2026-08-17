import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'react-native';
import Balloon from '../components/Balloon';
import LeadForm from '../components/LeadForm';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { LANGUAGES } from '../i18n/translations';
import { API_BASE_URL, fetchContent } from '../api';
import { formatPhone, phoneToApi } from '../phone';

export default function LoginScreen() {
  const { t, lang, setLang } = useI18n();
  const { login } = useAuth();
  const [leadOpen, setLeadOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // Показываем адрес сервера только при сетевой ошибке — сразу видно,
  // куда приложение стучится и что править в mobile-app/.env.
  const [showServer, setShowServer] = useState(false);
  const [busy, setBusy] = useState(false);
  // Логотип детского сада — админ загружает его в панели.
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    fetchContent().then((c) => {
      const url = (c as { branding?: { logoUrl?: string } } | null)?.branding?.logoUrl;
      if (url) setLogoUrl(url.startsWith('http') ? url : API_BASE_URL + url);
    });
  }, []);

  const submit = async () => {
    if (!phone.trim() || !password) {
      setError(t('login.err_fields'));
      return;
    }
    setError('');
    setShowServer(false);
    setBusy(true);
    const res = await login(phoneToApi(phone), password);
    setBusy(false);
    if (!res.ok) {
      const isNetwork = res.error === 'network';
      setError(isNetwork ? t('login.err_network') : t('login.err_invalid'));
      setShowServer(isNetwork);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      {/* переключатель языка */}
      <View style={styles.langRow}>
        {LANGUAGES.map((l) => {
          const on = lang === l.code;
          return (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, on && styles.langBtnOn]}
              onPress={() => setLang(l.code)}
            >
              <Text style={[styles.langText, on && styles.langTextOn]}>{l.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.card}>
        <View style={styles.logo}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logoImg} resizeMode="contain" />
          ) : (
            <>
              <Balloon size={40} />
              <Text style={styles.brand}>Аяла Kids</Text>
            </>
          )}
        </View>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

        <TextInput
          style={styles.input}
          placeholder="+7-777-777-77-77"
          placeholderTextColor="#c4a99b"
          keyboardType="phone-pad"
          autoCapitalize="none"
          maxLength={16} // +7-777-777-77-77
          value={phone}
          onChangeText={(v) => {
            setPhone(formatPhone(v));
            if (error) setError('');
          }}
        />
        <TextInput
          style={styles.input}
          placeholder={t('login.password')}
          placeholderTextColor="#c4a99b"
          secureTextEntry
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) setError('');
          }}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}
        {showServer && <Text style={styles.errorHint}>{API_BASE_URL}</Text>}

        <TouchableOpacity style={styles.submit} onPress={submit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{t('login.submit')}</Text>
          )}
        </TouchableOpacity>

        {/* Для тех, у кого ещё нет аккаунта: оставить заявку в детский сад. */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>{t('login.no_account')}</Text>
          <View style={styles.line} />
        </View>
        <TouchableOpacity style={styles.leadBtn} onPress={() => setLeadOpen(true)} activeOpacity={0.85}>
          <Text style={styles.leadText}>{t('login.leave_lead')}</Text>
        </TouchableOpacity>
      </View>

      <LeadForm visible={leadOpen} type="enroll" onClose={() => setLeadOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', paddingHorizontal: 22 },
  langRow: { position: 'absolute', top: 54, right: 18, flexDirection: 'row', gap: 6 },
  langBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  langBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { fontSize: 12, fontWeight: '800', color: colors.muted, fontFamily: 'Nunito_800ExtraBold' },
  langTextOn: { color: '#fff' },

  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#b08573',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 11, justifyContent: 'center', marginBottom: 18 },
  logoImg: { width: 110, height: 74 },
  brand: { fontSize: 20, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },
  title: { fontSize: 22, fontWeight: '800', color: colors.primaryDark, textAlign: 'center', fontFamily: 'Nunito_800ExtraBold' },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 20, fontFamily: 'Nunito_600SemiBold' },

  label: { fontSize: 12.5, fontWeight: '800', color: colors.primaryDark, marginBottom: 9, fontFamily: 'Nunito_800ExtraBold' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 14 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 11.5, fontWeight: '700', color: colors.muted, fontFamily: 'Nunito_700Bold' },
  leadBtn: {
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  leadText: { fontSize: 14.5, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },

  input: {
    borderWidth: 1.5,
    borderColor: '#e6d3c8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 12,
    color: colors.text,
    fontFamily: 'Nunito_600SemiBold',
    backgroundColor: '#FFFBF9',
  },
  error: { color: '#c0392b', fontSize: 13, fontWeight: '700', marginBottom: 10, fontFamily: 'Nunito_700Bold' },
  errorHint: { color: colors.muted, fontSize: 11.5, marginTop: -6, marginBottom: 10, fontFamily: 'Nunito_600SemiBold' },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
});
