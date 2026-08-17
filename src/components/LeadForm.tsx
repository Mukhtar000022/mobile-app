import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { submitLead, LeadPayload } from '../api';
import { useI18n } from '../i18n';

export default function LeadForm({
  visible,
  type,
  onClose,
}: {
  visible: boolean;
  type: LeadPayload['type'];
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const title = type === 'consultation' ? t('lead.title_consult') : t('lead.title_enroll');

  const reset = () => {
    setName('');
    setPhone('');
    setMessage('');
    setStatus('idle');
    setError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError(t('lead.err_name_phone'));
      return;
    }
    setStatus('sending');
    setError('');
    const res = await submitLead({ type, name: name.trim(), phone: phone.trim(), message: message.trim() });
    if (res.ok) {
      setStatus('ok');
    } else {
      setStatus('error');
      setError(res.error || t('lead.send_err'));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          {status === 'ok' ? (
            <>
              <Text style={styles.title}>{t('lead.thanks_title')}</Text>
              <Text style={styles.subtitle}>{t('lead.thanks_text')}</Text>
              <TouchableOpacity style={styles.cta} onPress={close}>
                <Text style={styles.ctaText}>{t('common.done')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>{title}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('lead.name_ph')}
                placeholderTextColor="#c4a99b"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder={t('lead.phone_ph')}
                placeholderTextColor="#c4a99b"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
                placeholder={t('lead.comment_ph')}
                placeholderTextColor="#c4a99b"
                multiline
                value={message}
                onChangeText={setMessage}
              />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity style={styles.cta} onPress={submit} disabled={status === 'sending'}>
                {status === 'sending' ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{t('lead.submit')}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancel} onPress={close}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(40,20,12,0.42)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  title: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginBottom: 14, fontFamily: 'Nunito_800ExtraBold' },
  subtitle: { fontSize: 14, color: colors.text, marginBottom: 20, fontFamily: 'Nunito_600SemiBold' },
  input: {
    borderWidth: 1,
    borderColor: '#e6d3c8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
    color: colors.text,
    fontFamily: 'Nunito_600SemiBold',
  },
  error: { color: '#c0392b', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  cta: { backgroundColor: colors.primary, borderRadius: 22, paddingVertical: 13, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  cancel: { alignItems: 'center', marginTop: 12 },
  cancelText: { color: colors.muted, fontWeight: '700', fontSize: 13, fontFamily: 'Nunito_700Bold' },
});
