// app/_layout.tsx
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '../../database/db';
import { ThemeProvider, useThemeMode } from '@/hooks/theme-context';

// Al llamar a la función aquí afuera, SQLite crea y actualiza 
// las tablas de forma síncrona una fracción de segundo ANTES 
// de que React intente renderizar cualquier pantalla.
initDatabase();

// Componente interno: necesita estar DENTRO del ThemeProvider para leer el modo.
function Contenido() {
  const { esOscuro } = useThemeMode();
  return (
    <>
      {/* Iconos de la barra de estado claros u oscuros según el tema */}
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      {/* Al devolver <Slot /> de inmediato, Expo Router puede 
          enrutar la aplicación sin lanzar advertencias de "unmounted component". */}
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Contenido />
    </ThemeProvider>
  );
}
