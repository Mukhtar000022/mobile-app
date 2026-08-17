import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppIcon from './AppIcon';
import { colors } from '../theme';

export type PayButtonVariant = 'solid' | 'gradient' | 'outline' | 'soft' | 'glow' | 'card';

export const PAY_BUTTON_VARIANTS: PayButtonVariant[] = [
  'solid',
  'gradient',
  'outline',
  'soft',
  'glow',
  'card',
];

export const PAY_BUTTON_VARIANT_LABELS: Record<PayButtonVariant, string> = {
  solid: 'Сплошная',
  gradient: 'Градиент',
  outline: 'Контур',
  soft: 'Мягкая',
  glow: 'С подсветкой',
  card: 'Карточка',
};

type Props = {
  variant?: PayButtonVariant;
  label?: string;
  /** Необязательная сумма, напр. "15 000 ₸" — показывается на некоторых дизайнах. */
  amount?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function PayButton({
  variant = 'gradient',
  label = 'Оплатить',
  amount,
  onPress,
  disabled,
  style,
}: Props) {
  const content = (color: string) => (
    <>
      <AppIcon name="credit-card" size={19} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
      {!!amount && <Text style={[styles.amount, { color }]}>{amount}</Text>}
    </>
  );

  // --- GRADIENT ---
  if (variant === 'gradient') {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled} style={[styles.shadowStrong, style]}>
        <LinearGradient
          colors={['#FBB89C', '#ED7A4E', '#D85A30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles.rounded]}
        >
          {content('#fff')}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // --- GLOW (тёмная с подсветкой) ---
  if (variant === 'glow') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        style={[styles.base, styles.rounded, styles.glow, style]}
      >
        {content('#FFE7DB')}
      </TouchableOpacity>
    );
  }

  // --- OUTLINE (контурная) ---
  if (variant === 'outline') {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
        style={[styles.base, styles.rounded, styles.outline, style]}
      >
        {content(colors.primary)}
      </TouchableOpacity>
    );
  }

  // --- SOFT (мягкая на кремовом фоне) ---
  if (variant === 'soft') {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
        style={[styles.base, styles.rounded, styles.soft, style]}
      >
        {content('#854F0B')}
      </TouchableOpacity>
    );
  }

  // --- CARD (карточка с иконкой и суммой справа) ---
  if (variant === 'card') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        style={[styles.card, styles.shadowSoft, style]}
      >
        <View style={styles.cardIcon}>
          <AppIcon name="credit-card" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardHint}>Безопасная оплата картой</Text>
        </View>
        {!!amount && <Text style={styles.cardAmount}>{amount}</Text>}
        <AppIcon name="chevron-right" size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  // --- SOLID (по умолчанию, в стиле остальных кнопок приложения) ---
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, styles.rounded, styles.solid, style]}
    >
      {content('#fff')}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  rounded: { borderRadius: 22 },
  label: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    marginLeft: 4,
    opacity: 0.95,
  },

  solid: { backgroundColor: colors.primary },

  outline: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },

  soft: { backgroundColor: '#FAEEDA' },

  glow: {
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  shadowStrong: {
    shadowColor: '#ED7A4E',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  shadowSoft: {
    shadowColor: '#b08573',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 14, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  cardHint: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  cardAmount: { fontSize: 15, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold', marginRight: 4 },
});
