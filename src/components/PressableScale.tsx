import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

/**
 * Reemplazo de TouchableOpacity/Pressable que se encoge levemente
 * al tocarlo, dando retroalimentación táctil animada en botones
 * y tarjetas interactivas de toda la app.
 */
export default function PressableScale({
  style,
  scaleTo = 0.94,
  onPressIn,
  onPressOut,
  children,
  ...resto
}: PressableScaleProps) {
  const escala = useSharedValue(1);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  return (
    <AnimatedPressable
      style={[style, estiloAnimado]}
      onPressIn={(evento) => {
        escala.value = withTiming(scaleTo, { duration: 100 });
        onPressIn?.(evento);
      }}
      onPressOut={(evento) => {
        escala.value = withTiming(1, { duration: 150 });
        onPressOut?.(evento);
      }}
      {...resto}
    >
      {children}
    </AnimatedPressable>
  );
}
