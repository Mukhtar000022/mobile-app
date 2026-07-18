import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, palettes, PaletteKey } from '../theme';
import { GalleryItem } from '../data/content';

export default function GalleryScreen({ items }: { items: GalleryItem[] }) {
  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Галерея</Text>
      <View style={styles.grid}>
        {items.map((item) => {
          const p = palettes[(item.color as PaletteKey) || 'orange'];
          return (
            <View key={item.id} style={[styles.cell, { backgroundColor: p.bg }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginBottom: 14, marginTop: 8, fontFamily: 'Nunito_800ExtraBold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  cell: { width: '48%', height: 96, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 30 },
});
