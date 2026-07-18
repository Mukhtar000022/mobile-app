import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Platform, Linking } from 'react-native';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import AppBar from './src/components/AppBar';
import BottomNav from './src/components/BottomNav';
import Drawer from './src/components/Drawer';
import LeadForm from './src/components/LeadForm';
import HomeScreen from './src/screens/HomeScreen';
import ListCardScreen from './src/screens/ListCardScreen';
import ParentsScreen from './src/screens/ParentsScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import { colors } from './src/theme';
import { ScreenName, screenTitles } from './src/navigation';
import { Content, defaultContent } from './src/data/content';
import { fetchContent } from './src/api';
import { LeadPayload } from './src/api';

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const [screen, setScreen] = useState<ScreenName>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [content, setContent] = useState<Content>(defaultContent);
  const [leadForm, setLeadForm] = useState<{ visible: boolean; type: LeadPayload['type'] }>({
    visible: false,
    type: 'consultation',
  });

  useEffect(() => {
    fetchContent().then((remote) => {
      if (remote) setContent(remote);
    });
  }, []);

  const navigate = useCallback((s: ScreenName) => setScreen(s), []);

  const openLeadForm = (type: LeadPayload['type']) => setLeadForm({ visible: true, type });
  const closeLeadForm = () => setLeadForm((f) => ({ ...f, visible: false }));

  const callPrimary = () => {
    const phone = content.contacts.phones[0]?.replace(/[^\d+]/g, '');
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  if (!fontsLoaded) return null;

  let screenEl: React.ReactNode = null;
  switch (screen) {
    case 'home':
      screenEl = <HomeScreen content={content} onNavigate={navigate} onConsult={() => openLeadForm('consultation')} />;
      break;
    case 'education':
      screenEl = (
        <ListCardScreen title="Образование" items={content.education} onBack={() => navigate('home')} />
      );
      break;
    case 'parents':
      screenEl = <ParentsScreen items={content.parents} onBack={() => navigate('home')} />;
      break;
    case 'courses':
      screenEl = <ListCardScreen title="Кружки и курсы" items={content.courses} />;
      break;
    case 'gallery':
      screenEl = <GalleryScreen items={content.gallery} />;
      break;
    case 'contacts':
      screenEl = (
        <ContactsScreen
          contacts={content.contacts}
          onCall={callPrimary}
          onEnroll={() => openLeadForm('enroll')}
        />
      );
      break;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.container}>
        <AppBar title={screenTitles[screen]} onMenuPress={() => setDrawerOpen(true)} />
        <View style={styles.screen}>{screenEl}</View>
        <BottomNav current={screen} onSelect={navigate} />
      </View>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onNavigate={navigate} />
      <LeadForm
        visible={leadForm.visible}
        type={leadForm.type}
        onClose={closeLeadForm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1 },
});
