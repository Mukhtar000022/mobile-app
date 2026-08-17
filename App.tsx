import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import { applyTheme } from './src/theme';
import { fetchContent } from './src/api';
import { LanguageProvider } from './src/i18n';
import { AuthProvider } from './src/auth';
import { ChatProvider } from './src/chatContext';

const THEME_KEY = 'ayala_theme';

/**
 * Загрузчик приложения.
 *
 * Цвета задаёт админ в панели. Стили экранов собираются в момент их импорта,
 * поэтому порядок такой: берём сохранённую тему → применяем → и только затем
 * подключаем интерфейс (require, а не import сверху файла). Свежую тему
 * забираем с сервера и сохраняем — она применится при следующем запуске.
 */
export default function App() {
  const [themeReady, setThemeReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(THEME_KEY);
        if (cached) applyTheme(JSON.parse(cached));
      } catch (e) {
        /* нет сохранённой темы — остаются цвета по умолчанию */
      }
      setThemeReady(true);

      // Обновляем тему в фоне: применится при следующем запуске.
      try {
        const content: any = await fetchContent();
        if (content && content.theme) {
          await AsyncStorage.setItem(THEME_KEY, JSON.stringify(content.theme));
        }
      } catch (e) {
        /* сеть недоступна — не критично */
      }
    })();
  }, []);

  if (!themeReady || !fontsLoaded) return null;

  // Интерфейс подключаем только сейчас — тема уже применена.
  const AppInner = require('./src/AppInner').default;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          {/* один WebSocket на всё приложение: чат работает в реальном времени
              и счётчик непрочитанных виден на любом экране */}
          <ChatProvider>
            <AppInner />
          </ChatProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
