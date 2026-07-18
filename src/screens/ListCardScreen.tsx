import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Card from '../components/Card';
import AppIcon from '../components/AppIcon';
import { colors } from '../theme';
import { CardItem } from '../data/content';

// Generic screen for Education / Courses (card-style lists), optionally with a back button.
export default function ListCardScreen({
  title,
  items,
  onBack,
}: {
  title: string;
  items: CardItem[];
  onBack?: () => void;
}) {
  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
      {onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <AppIcon name="arrow-left" size={17} color={colors.primary} />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <Card key={item.id} icon={item.icon} title={item.title} desc={item.desc} color={item.color} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 6 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 2 },
  backText: { fontSize: 13, fontWeight: '700', color: colors.primary, fontFamily: 'Nunito_700Bold' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginBottom: 14, marginTop: 8, fontFamily: 'Nunito_800ExtraBold' },
});
