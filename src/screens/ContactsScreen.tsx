import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import AppIcon from '../components/AppIcon';
import { colors } from '../theme';
import { Contacts } from '../data/content';

export default function ContactsScreen({
  contacts,
  onCall,
  onEnroll,
}: {
  contacts: Contacts;
  onCall: () => void;
  onEnroll: () => void;
}) {
  return (
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Контакты</Text>

      <View style={styles.ccard}>
        <View style={styles.av}>
          <AppIcon name="building" size={24} color="#fff" />
        </View>
        <Text style={styles.ccardName}>{contacts.name}</Text>
        <Text style={styles.ccardCity}>{contacts.city}</Text>
      </View>

      {contacts.phones.map((phone, idx) => (
        <TouchableOpacity key={idx} style={styles.row} onPress={() => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`)}>
          <AppIcon name={idx === 0 ? 'phone' : 'device-mobile'} size={18} color={colors.primary} />
          <Text style={styles.rowText}>{phone}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.row} onPress={() => Linking.openURL(`mailto:${contacts.email}`)}>
        <AppIcon name="mail" size={18} color={colors.primary} />
        <Text style={styles.rowText}>{contacts.email}</Text>
      </TouchableOpacity>
      <View style={[styles.row, { borderBottomWidth: 0 }]}>
        <AppIcon name="map-pin" size={18} color={colors.primary} />
        <Text style={styles.rowText}>{contacts.address}</Text>
      </View>

      <View style={styles.cbtns}>
        <TouchableOpacity style={[styles.cbtn, { backgroundColor: colors.primary }]} onPress={onCall}>
          <Text style={[styles.cbtnText, { color: '#fff' }]}>Позвонить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cbtn, { backgroundColor: '#FAEEDA' }]} onPress={onEnroll}>
          <Text style={[styles.cbtnText, { color: '#854F0B' }]}>Записаться</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.socials}>
        <AppIcon name="brand-instagram" size={24} color="#D4537E" />
        <AppIcon name="brand-facebook" size={24} color="#378ADD" />
        <AppIcon name="brand-whatsapp" size={24} color="#1D9E75" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginBottom: 14, marginTop: 8, fontFamily: 'Nunito_800ExtraBold' },
  ccard: { backgroundColor: colors.heroBg, borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 14 },
  av: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: '#ED7A4E', marginBottom: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  ccardName: { fontSize: 15, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  ccardCity: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 13, fontWeight: '600', color: '#4a3b33', fontFamily: 'Nunito_600SemiBold' },
  cbtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cbtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  cbtnText: { fontSize: 12, fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  socials: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 16 },
});
