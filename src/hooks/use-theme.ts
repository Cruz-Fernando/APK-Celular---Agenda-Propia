/**
 * Devuelve la paleta de colores activa (clara u oscura).
 * El modo se controla desde ThemeProvider (ver theme-context.tsx)
 * y se cambia con el componente <ThemeToggle />.
 */

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/theme-context';

export function useTheme() {
  const { esOscuro } = useThemeMode();
  return Colors[esOscuro ? 'dark' : 'light'];
}
