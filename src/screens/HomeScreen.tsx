import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Tile from '../components/Tile';
import { colors } from '../theme';
import { Content } from '../data/content';
import { ScreenName } from '../navigation';

export default function HomeScreen({
  content,
  onNavigate,
  onConsult,
}: {
  content: Content;
  onNavigate: (s: ScreenName) => void;
  onConsult: () => void;
}) {
  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.emo}>{content.home.heroEmoji}</Text>
        <Text style={styles.heroText}>{content.home.heroText}</Text>
        <TouchableOpacity style={styles.cta} onPress={onConsult}>
          <Text style={styles.ctaText}>Получить консультацию</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tiles}>
        <Tile icon="book" label="Образование" bg="#E1F5EE" color="#0F6E56" onPress={() => onNavigate('education')} />
        <Tile icon="users" label="Родителям" bg="#FAEEDA" color="#854F0B" onPress={() => onNavigate('parents')} />
        <Tile icon="photo" label="Галерея" bg="#FBEAF0" color="#993556" onPress={() => onNavigate('gallery')} />
        <Tile icon="confetti" label="Кружки" bg="#EEEDFE" color="#534AB7" onPress={() => onNavigate('courses')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 6 },
  hero: { backgroundColor: colors.heroBg, borderRadius: 22, padding: 22, alignItems: 'center', marginBottom: 14 },
  emo: { fontSize: 48, marginBottom: 10 },
  heroText: { fontSize: 14, fontWeight: '700', color: colors.primaryDark, textAlign: 'center', lineHeight: 20, fontFamily: 'Nunito_700Bold' },
  cta: { marginTop: 14, backgroundColor: colors.primary, borderRadius: 22, paddingVertical: 12, alignSelf: 'stretch', alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
});
