import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppIcon from './AppIcon';
import { colors } from '../theme';

export default function ListRow({
  icon,
  title,
  desc,
  noBorder,
}: {
  icon: string;
  title?: string;
  desc?: string;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.row, noBorder && { borderBottomWidth: 0 }]}>
      <AppIcon name={icon} size={19} color={colors.primary} />
      <View style={{ flex: 1 }}>
        {title ? <Text style={styles.bold}>{title}</Text> : null}
        {desc ? <Text style={styles.desc}>{desc}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bold: { fontWeight: '800', color: colors.text, fontSize: 14, marginBottom: 1, fontFamily: 'Nunito_800ExtraBold' },
  desc: { fontSize: 13, fontWeight: '600', color: '#4a3b33', fontFamily: 'Nunito_600SemiBold' },
});
