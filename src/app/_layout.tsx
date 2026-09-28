// app/_layout.tsx
import { useEffect, useState } from 'react';
import { initDatabase } from '../../database/db'; // Verifica que esta ruta sea correcta
import { Slot } from 'expo-router'; // Slot es un marcador de posición para las rutas anidadas

export default function RootLayout() {
  // Estado para saber si la base de datos ya está lista
  const [dbLista, setDbLista] = useState(false);

  useEffect(() => {
    // 1. Inicializamos las tablas de SQLite
    initDatabase();
    // 2. Le decimos a React que ya puede continuar dibujando la pantalla
    setDbLista(true);
  }, []);

  // Mientras la base de datos se crea, no mostramos nada (evita errores de pantalla roja)
  if (!dbLista) {
    return null; 
  }

  // Si la DB está lista, <Slot /> inyecta las rutas hijas 
  // (en este caso, automáticamente cargará tu carpeta (tabs))
  return <Slot />;
}