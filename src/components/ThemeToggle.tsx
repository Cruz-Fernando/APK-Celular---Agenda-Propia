import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import PressableScale from './PressableScale';
import { useThemeMode } from '@/hooks/theme-context';
import { useTheme } from '@/hooks/use-theme';

/**
 * Botón para alternar entre modo claro y oscuro.
 * El icono (sol/luna) gira con un resorte al cambiar de modo.
 */
export default function ThemeToggle() {
  const { esOscuro, alternar } = useThemeMode();
  const theme = useTheme();
  const giro = useSharedValue(esOscuro ? 1 : 0);

  useEffect(() => {
    giro.value = withSpring(esOscuro ? 1 : 0, { damping: 12, stiffness: 120 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esOscuro]);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ rotate: `${giro.value * 180}deg` }],
  }));

  return (
    <PressableScale
      onPress={alternar}
      accessibilityLabel="Cambiar entre modo claro y oscuro"
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.backgroundSelected,
      }}
    >
      <Animated.View style={estilo}>
        <Ionicons name={esOscuro ? 'moon' : 'sunny'} size={22} color={esOscuro ? '#F1C40F' : '#F39C12'} />
      </Animated.View>
    </PressableScale>
  );
}
