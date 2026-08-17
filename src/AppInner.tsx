// Основной интерфейс приложения. Вынесен из App.tsx отдельным модулем,
// чтобы подключаться уже ПОСЛЕ применения цветов из админ-панели:
// стили экранов собираются на этапе импорта, поэтому тема должна быть
// применена раньше (см. App.tsx).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppBar from './components/AppBar';
import BottomNav from './components/BottomNav';
import Drawer from './components/Drawer';
import LeadForm from './components/LeadForm';
import PaymentSheet from './components/PaymentSheet';
import ParentHomeScreen from './screens/ParentHomeScreen';
import TutorDayScreen from './screens/TutorDayScreen';
import HomeScreen from './screens/HomeScreen';
import ContactsScreen from './screens/ContactsScreen';
import CabinetScreen from './screens/CabinetScreen';
import RoutineScreen from './screens/RoutineScreen';
import ChatScreen from './screens/ChatScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import DevCardScreen from './screens/DevCardScreen';
import LoginScreen from './screens/LoginScreen';
import { colors } from './theme';
import { ScreenName, isHiddenFor } from './navigation';
import { Content, defaultContent } from './data/content';
import { fetchContent, fetchSettings } from './api';
import { LeadPayload } from './api';
import { PAYMENT, PAY_BUTTON_DESIGN, KASPI } from './config';
import { PayButtonVariant } from './components/PayButton';
import { LanguageProvider, useI18n } from './i18n';
import { AuthProvider, useAuth } from './auth';
import { ChatProvider } from './chatContext';

type PaymentConfig = {
  enabled: boolean;
  design: PayButtonVariant;
  amount: string;
  title: string;
  kaspiUrl: string;
};

const DEFAULT_PAYMENT: PaymentConfig = {
  enabled: true,
  design: PAY_BUTTON_DESIGN,
  amount: PAYMENT.amount,
  title: PAYMENT.title,
  kaspiUrl: KASPI.payUrl,
};

const PAY_DESIGNS: PayButtonVariant[] = ['solid', 'gradient', 'outline', 'soft', 'glow', 'card'];

export default function AppInner() {
  const { t } = useI18n();
  const { token, user, loading: authLoading } = useAuth();

  // Стартовый раздел зависит от роли: родителю — день ребёнка, воспитателю —
  // день группы. Устанавливается один раз, когда профиль загрузился.
  const [screen, setScreen] = useState<ScreenName>('home');
  const startSet = useRef(false);
  useEffect(() => {
    if (startSet.current || !user) return;
    startSet.current = true;
    setScreen(user.role === 'tutor' ? 'day' : 'home');
  }, [user]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [content, setContent] = useState<Content>(defaultContent);
  const [leadForm, setLeadForm] = useState<{ visible: boolean; type: LeadPayload['type'] }>({
    visible: false,
    type: 'consultation',
  });
  const [payVisible, setPayVisible] = useState(false);
  const [payment, setPayment] = useState<PaymentConfig>(DEFAULT_PAYMENT);

  useEffect(() => {
    fetchContent().then((remote) => {
      if (remote) setContent(remote);
    });
    fetchSettings().then((s) => {
      if (s?.payment) {
        setPayment((prev) => ({
          ...prev,
          ...s.payment,
          // подстраховка: если с сервера пришёл неизвестный дизайн — берём дефолтный
          design: PAY_DESIGNS.includes(s.payment.design as PayButtonVariant)
            ? (s.payment.design as PayButtonVariant)
            : prev.design,
        }));
      }
    });
  }, []);

  const navigate = useCallback((s: ScreenName) => setScreen(s), []);

  // Если воспитатель оказался на скрытом для него разделе — возвращаем в кабинет.
  useEffect(() => {
    if (isHiddenFor(user?.role, screen)) setScreen('cabinet');
  }, [user?.role, screen]);

  const openLeadForm = (type: LeadPayload['type']) => setLeadForm({ visible: true, type });
  const closeLeadForm = () => setLeadForm((f) => ({ ...f, visible: false }));

  const callPrimary = () => {
    const phone = content.contacts.phones[0]?.replace(/[^\d+]/g, '');
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  if (authLoading) return null;

  // Не вошли — показываем экран входа (воспитатель / родитель).
  if (!token) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <LoginScreen />
      </SafeAreaView>
    );
  }

  let screenEl: React.ReactNode = null;
  switch (screen) {
    case 'cabinet':
      screenEl = <CabinetScreen />;
      break;
    case 'routine':
      screenEl = <RoutineScreen />;
      break;
    case 'chat':
      screenEl = <ChatScreen />;
      break;
    case 'attendance':
      screenEl = <AttendanceScreen />;
      break;
    case 'devcard':
      screenEl = <DevCardScreen />;
      break;
    case 'day':
      screenEl = <TutorDayScreen />;
      break;
    case 'home':
      // Родителю — экран «день ребёнка», остальным — витрина сада.
      screenEl =
        user?.role === 'parent' ? (
          <ParentHomeScreen onOpenChat={() => navigate('chat')} />
        ) : (
          <HomeScreen
            content={content}
            onNavigate={navigate}
            onConsult={() => openLeadForm('consultation')}
            onPay={() => setPayVisible(true)}
            payEnabled={payment.enabled}
            payDesign={payment.design}
            payAmount={payment.amount}
          />
        );
      break;
    case 'contacts':
      screenEl = (
        <ContactsScreen
          contacts={content.contacts}
          onCall={callPrimary}
          onEnroll={() => openLeadForm('enroll')}
          onPay={() => setPayVisible(true)}
          payEnabled={payment.enabled}
          payDesign={payment.design}
          payAmount={payment.amount}
        />
      );
      break;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.container}>
        <AppBar title={screen === 'home' ? t('nav.brand') : t(`nav.${screen}`)} onMenuPress={() => setDrawerOpen(true)} />
        <View style={styles.screen}>{screenEl}</View>
        <BottomNav current={screen} onSelect={navigate} />
      </View>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={navigate}
        onPay={() => setPayVisible(true)}
        payEnabled={payment.enabled}
      />
      <LeadForm
        visible={leadForm.visible}
        type={leadForm.type}
        onClose={closeLeadForm}
      />
      <PaymentSheet
        visible={payVisible}
        title={payment.title}
        amount={payment.amount}
        design={payment.design}
        kaspiUrl={payment.kaspiUrl}
        onClose={() => setPayVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1 },
});
