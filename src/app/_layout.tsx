import { useEffect, useState } from 'react';
import { initDatabase } from '../../database/db';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  // 1. Creamos una variable para saber si la BD ya está lista
  const [dbLista, setDbLista] = useState(false);

  useEffect(() => {
    // 2. Inicializamos las tablas
    initDatabase();
    // 3. Le decimos a React que ya puede continuar
    setDbLista(true);
  }, []);

  // 4. Bloqueamos la carga de las pantallas hasta que dbLista sea true
  if (!dbLista) {
    return null; 
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}