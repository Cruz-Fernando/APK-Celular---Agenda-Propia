import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import db from '../../database/db';

type Modo = 'claro' | 'oscuro';
type Ctx = { modo: Modo; esOscuro: boolean; alternar: () => void };

const ThemeCtx = createContext<Ctx | null>(null);

// Lee la preferencia guardada en SQLite (tabla 'ajustes'). Es síncrono,
// así que la app arranca directamente con el tema correcto, sin parpadeo.
function leerGuardado(): Modo | null {
  try {
    db.execSync('CREATE TABLE IF NOT EXISTS ajustes (clave TEXT PRIMARY KEY, valor TEXT)');
    const fila = db.getFirstSync<{ valor: string }>('SELECT valor FROM ajustes WHERE clave = ?', ['tema']);
    return fila?.valor === 'oscuro' || fila?.valor === 'claro' ? fila.valor : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sistema = useColorScheme();
  const [modo, setModo] = useState<Modo>(() => leerGuardado() ?? (sistema === 'dark' ? 'oscuro' : 'claro'));

  const alternar = useCallback(() => {
    const nuevo: Modo = modo === 'oscuro' ? 'claro' : 'oscuro';
    setModo(nuevo);
    try {
      db.runSync('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)', ['tema', nuevo]);
    } catch {}
  }, [modo]);

  const valor = useMemo(() => ({ modo, esOscuro: modo === 'oscuro', alternar }), [modo, alternar]);

  return <ThemeCtx.Provider value={valor}>{children}</ThemeCtx.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeMode debe usarse dentro de <ThemeProvider>');
  return ctx;
}
