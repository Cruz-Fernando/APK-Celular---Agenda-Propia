import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Envuelve cualquier contenido en una animación de aparición
 * (desvanecido + desplazamiento hacia arriba). Se usa en encabezados,
 * tarjetas y elementos de listas para dar sensación de movimiento
 * sin tener que repetir lógica de animación en cada pantalla.
 */
export default function Reveal({ children, delay = 0, style }: RevealProps) {
  const progreso = useSharedValue(0);

  useEffect(() => {
    progreso.value = withDelay(
      delay,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    );
    // Solo se dispara al montar el componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estiloAnimado = useAnimatedStyle(() => ({
    opacity: progreso.value,
    transform: [{ translateY: (1 - progreso.value) * 14 }],
  }));

  return <Animated.View style={[style, estiloAnimado]}>{children}</Animated.View>;
}
