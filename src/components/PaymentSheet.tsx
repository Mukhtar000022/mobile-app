import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import PayButton, {
  PayButtonVariant,
  PAY_BUTTON_VARIANTS,
  PAY_BUTTON_VARIANT_LABELS,
} from './PayButton';
import { colors } from '../theme';
import { PAY_BUTTON_DESIGN, PAY_BUTTON_DESIGN_PREVIEW } from '../config';
import { openKaspiPayment } from '../kaspi';
import { logPayment } from '../api';
import { useI18n } from '../i18n';

export default function PaymentSheet({
  visible,
  title = 'Оплата',
  amount = '15 000 ₸',
  design = PAY_BUTTON_DESIGN,
  kaspiUrl,
  onClose,
}: {
  visible: boolean;
  title?: string;
  amount?: string;
  design?: PayButtonVariant;
  kaspiUrl?: string;
  onClose: () => void;
}) {
  // Локальное состояние нужно только для встроенного превью-переключателя дизайнов.
  const [previewDesign, setPreviewDesign] = useState<PayButtonVariant>(design);
  const [done, setDone] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const activeDesign = PAY_BUTTON_DESIGN_PREVIEW ? previewDesign : design;

  const close = () => {
    setDone(false);
    setName('');
    setPhone('');
    setError('');
    onClose();
  };

  // Открываем Kaspi для оплаты. Подтверждение оплаты происходит внутри Kaspi;
  // после возврата показываем экран с инструкцией.
  const pay = async () => {
    if (!name.trim()) {
      setError(t('pay.err_for_whom'));
      return;
    }
    setError('');
    const opened = await openKaspiPayment(amount, kaspiUrl);
    if (opened) {
      // записываем в журнал платежей (не блокирует оплату)
      logPayment(amount, { name: name.trim(), phone: phone.trim() });
      setDone(true);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          {done ? (
            <View style={styles.center}>
              <View style={styles.okBadge}>
                <AppIcon name="wallet" size={38} color="#1D9E75" />
              </View>
              <Text style={styles.title}>{t('pay.done_title')}</Text>
              <Text style={styles.subtitle}>{t('pay.done_text', { amount })}</Text>
              <TouchableOpacity style={styles.doneBtn} onPress={close}>
                <Text style={styles.doneText}>{t('common.done')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.handle} />
              <Text style={styles.title}>{title}</Text>

              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>{t('pay.amount_label')}</Text>
                <Text style={styles.amountValue}>{amount}</Text>
              </View>

              <Text style={styles.section}>{t('pay.method')}</Text>
              <View style={[styles.method, styles.methodActive]}>
                <View style={[styles.methodIcon, { backgroundColor: colors.primary }]}>
                  <AppIcon name="wallet" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Kaspi</Text>
                  <Text style={styles.methodHint}>{t('pay.kaspi_hint')}</Text>
                </View>
                <View style={[styles.radio, styles.radioActive]}>
                  <View style={styles.radioDot} />
                </View>
              </View>

              <View style={styles.secure}>
                <AppIcon name="shield-check" size={15} color={colors.muted} />
                <Text style={styles.secureText}>{t('pay.secure')}</Text>
              </View>

              <Text style={styles.section}>{t('pay.for_whom')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('pay.name_ph')}
                placeholderTextColor="#c4a99b"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (error) setError('');
                }}
              />
              <TextInput
                style={styles.input}
                placeholder={t('pay.phone_ph')}
                placeholderTextColor="#c4a99b"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              {!!error && <Text style={styles.error}>{error}</Text>}

              {PAY_BUTTON_DESIGN_PREVIEW && (
                <View style={styles.previewBox}>
                  <Text style={styles.previewTitle}>Дизайн кнопки (превью)</Text>
                  <View style={styles.chips}>
                    {PAY_BUTTON_VARIANTS.map((v) => (
                      <TouchableOpacity
                        key={v}
                        onPress={() => setPreviewDesign(v)}
                        style={[styles.chip, previewDesign === v && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, previewDesign === v && styles.chipTextActive]}>
                          {PAY_BUTTON_VARIANT_LABELS[v]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.previewHint}>
                    Выбрали дизайн? Пропишите его в src/config.ts → PAY_BUTTON_DESIGN
                  </Text>
                </View>
              )}

              <View style={{ marginTop: 18 }}>
                <PayButton variant={activeDesign} label={t('pay.pay_kaspi')} onPress={pay} />
              </View>

              <TouchableOpacity style={styles.cancel} onPress={close}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
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
    paddingBottom: 30,
    maxHeight: '90%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#eaddd5', marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '800', color: colors.primaryDark, marginBottom: 14, fontFamily: 'Nunito_800ExtraBold' },
  subtitle: { fontSize: 14, color: colors.text, textAlign: 'center', marginBottom: 20, fontFamily: 'Nunito_600SemiBold', lineHeight: 20 },

  amountBox: {
    backgroundColor: colors.heroBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  amountLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, fontFamily: 'Nunito_600SemiBold' },
  amountValue: { fontSize: 26, fontWeight: '800', color: colors.primaryDark, marginTop: 4, fontFamily: 'Nunito_800ExtraBold' },

  section: { fontSize: 13, fontWeight: '800', color: colors.primaryDark, marginBottom: 10, fontFamily: 'Nunito_800ExtraBold' },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  methodActive: { borderColor: colors.primary, backgroundColor: '#FFF7F3' },
  methodIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#FAEEDA',
    alignItems: 'center', justifyContent: 'center',
  },
  methodTitle: { fontSize: 14, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  methodHint: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d9c4b8',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },

  secure: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, marginBottom: 4 },
  secureText: { fontSize: 11, fontWeight: '600', color: colors.muted, fontFamily: 'Nunito_600SemiBold' },

  input: {
    borderWidth: 1,
    borderColor: '#e6d3c8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
    color: colors.text,
    fontFamily: 'Nunito_600SemiBold',
  },
  error: { color: '#c0392b', fontSize: 12, fontWeight: '700', marginBottom: 8, fontFamily: 'Nunito_700Bold' },

  previewBox: { marginTop: 16, backgroundColor: '#FBF3EE', borderRadius: 16, padding: 14 },
  previewTitle: { fontSize: 12, fontWeight: '800', color: colors.primaryDark, marginBottom: 10, fontFamily: 'Nunito_800ExtraBold' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: '#e6d3c8', borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 13, backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.muted, fontFamily: 'Nunito_700Bold' },
  chipTextActive: { color: '#fff' },
  previewHint: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 10, fontFamily: 'Nunito_600SemiBold' },

  center: { alignItems: 'center', paddingVertical: 10 },
  okBadge: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: '#E1F5EE',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: 6,
  },
  doneBtn: { backgroundColor: colors.primary, borderRadius: 22, paddingVertical: 13, paddingHorizontal: 40, alignSelf: 'stretch', alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: '800', fontSize: 15, fontFamily: 'Nunito_800ExtraBold' },

  cancel: { alignItems: 'center', marginTop: 14 },
  cancelText: { color: colors.muted, fontWeight: '700', fontSize: 13, fontFamily: 'Nunito_700Bold' },
});
