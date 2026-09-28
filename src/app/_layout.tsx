// app/_layout.tsx
import { Slot } from 'expo-router';
import { initDatabase } from '../../database/db';

// Al llamar a la función aquí afuera, SQLite crea y actualiza 
// las tablas de forma síncrona una fracción de segundo ANTES 
// de que React intente renderizar cualquier pantalla.
initDatabase();

export default function RootLayout() {
  // Al devolver <Slot /> de inmediato, Expo Router puede 
  // enrutar la aplicación sin lanzar advertencias de "unmounted component".
  return <Slot />;
}