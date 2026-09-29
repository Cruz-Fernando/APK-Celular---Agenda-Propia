import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, Vibration, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import Reveal from '@/components/Reveal';
import PressableScale from '@/components/PressableScale';

// Colores de acento: se mantienen iguales en claro y oscuro porque son
// la identidad visual de cada modo (Enfoque / Descanso), solo cambian
// las superficies y el texto según el tema.
const ACENTO_ENFOQUE = '#3e3535ff';
const ACENTO_DESCANSO = '#55EFC4';

export default function TemporizadorScreen() {
  const theme = useTheme();

  const [minutosEstudio, setMinutosEstudio] = useState('25');
  const [minutosDescanso, setMinutosDescanso] = useState('5');

  const [segundosRestantes, setSegundosRestantes] = useState(25 * 60);
  const [activo, setActivo] = useState(false);
  const [modoDescanso, setModoDescanso] = useState(false);
  const [avisoVisible, setAvisoVisible] = useState(false);

  // Evita que el aviso de "menos del 5%" se dispare más de una vez por fase.
  const avisoYaDadoRef = useRef(false);

  const obtenerTiempos = () => {
    return { estudio: parseInt(minutosEstudio) || 25, descanso: parseInt(minutosDescanso) || 5 };
  };

  const totalSegundosFase = () => {
    const { estudio, descanso } = obtenerTiempos();
    return (modoDescanso ? descanso : estudio) * 60;
  };

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;
    if (activo && segundosRestantes > 0) {
      intervalo = setInterval(() => setSegundosRestantes((prev) => prev - 1), 1000);
    } else if (activo && segundosRestantes === 0) {
      setActivo(false);
      Vibration.vibrate([0, 500, 200, 500]);
      Alert.alert(modoDescanso ? '¡Descanso terminado!' : '¡Buen trabajo!', modoDescanso ? 'A estudiar.' : 'Toma un respiro.');
      cambiarModo();
    }
    return () => clearInterval(intervalo);
  }, [activo, segundosRestantes]);

  // Aviso cuando queda menos del 5% de la fase actual (estudio o descanso).
  useEffect(() => {
    const total = totalSegundosFase();
    const umbral = Math.max(1, Math.ceil(total * 0.05));

    if (activo && segundosRestantes > 0 && segundosRestantes <= umbral && !avisoYaDadoRef.current) {
      avisoYaDadoRef.current = true;
      Vibration.vibrate(200);
      setAvisoVisible(true);
      setTimeout(() => setAvisoVisible(false), 4000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundosRestantes, activo]);

  const alternarTemporizador = () => setActivo(!activo);

  const reiniciarTemporizador = () => {
    setActivo(false);
    setAvisoVisible(false);
    avisoYaDadoRef.current = false;
    const { estudio, descanso } = obtenerTiempos();
    setSegundosRestantes(modoDescanso ? descanso * 60 : estudio * 60);
  };

  const cambiarModo = () => {
    const { estudio, descanso } = obtenerTiempos();
    const nuevoModo = !modoDescanso;
    setModoDescanso(nuevoModo);
    setSegundosRestantes(nuevoModo ? descanso * 60 : estudio * 60);
    setActivo(false);
    setAvisoVisible(false);
    avisoYaDadoRef.current = false;
  };

  const formatearTiempo = () => {
    const minutos = Math.floor(segundosRestantes / 60);
    const segundos = segundosRestantes % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  const acento = modoDescanso ? ACENTO_DESCANSO : ACENTO_ENFOQUE;
  const progreso = 1 - segundosRestantes / totalSegundosFase();

  // --- Animaciones ---
  const anchoBarra = useSharedValue(0);
  useEffect(() => {
    anchoBarra.value = withTiming(Math.min(1, Math.max(0, progreso)), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progreso]);
  const estiloBarra = useAnimatedStyle(() => ({ width: `${anchoBarra.value * 100}%` }));

  // Pulso suave alrededor del reloj mientras el temporizador corre.
  const pulso = useSharedValue(1);
  useEffect(() => {
    if (activo) {
      pulso.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulso.value = withTiming(1, { duration: 300 });
    }
  }, [activo]);
  const estiloPulso = useAnimatedStyle(() => ({ transform: [{ scale: pulso.value }] }));

  const styles = crearEstilos(theme);

  return (
    <View style={[styles.container, { backgroundColor: acento }]}>
      {/* Aviso animado de "casi termina" */}
      {avisoVisible && (
        <Reveal style={styles.avisoBanner}>
          <Ionicons name="alarm-outline" size={18} color="#FFF" />
          <Text style={styles.avisoTexto}>
            {modoDescanso ? '¡Ya casi termina el descanso!' : '¡Ya casi termina el estudio!'}
          </Text>
        </Reveal>
      )}

      {/* Configuración superior estilo píldora */}
      <Reveal style={[styles.configPill, { marginTop: avisoVisible ? 10 : 40 }]}>
        <View style={styles.inputGroup}>
          <Ionicons name="book-outline" size={16} color={theme.textSecondary} />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={minutosEstudio}
            onChangeText={setMinutosEstudio}
            maxLength={3}
            placeholderTextColor={theme.textSecondary}
          />
          <Text style={styles.label}>min</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.inputGroup}>
          <Ionicons name="cafe-outline" size={16} color={theme.textSecondary} />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={minutosDescanso}
            onChangeText={setMinutosDescanso}
            maxLength={3}
            placeholderTextColor={theme.textSecondary}
          />
          <Text style={styles.label}>min</Text>
        </View>
        <PressableScale style={styles.botonAplicar} onPress={reiniciarTemporizador}>
          <Ionicons name="checkmark" size={18} color="#f70000ff" />
        </PressableScale>
      </Reveal>

      {/* Reloj central con pulso animado */}
      <Animated.View style={[styles.relojCard, estiloPulso]}>
        <Text style={styles.titulo}>{modoDescanso ? 'Descanso' : 'Enfoque'}</Text>
        <Text style={styles.reloj}>{formatearTiempo()}</Text>

        <View style={styles.barraTrack}>
          <Animated.View style={[styles.barraFill, { backgroundColor: acento }, estiloBarra]} />
        </View>

        <View style={styles.botonesContainer}>
          <PressableScale style={styles.botonPrincipal} onPress={alternarTemporizador}>
            <Ionicons name={activo ? 'pause' : 'play'} size={28} color={acento} />
          </PressableScale>
          <PressableScale style={styles.botonSecundario} onPress={reiniciarTemporizador}>
            <Ionicons name="refresh" size={24} color={theme.textSecondary} />
          </PressableScale>
        </View>
      </Animated.View>

      {/* Botón inferior para saltar modo */}
      <PressableScale style={styles.botonModo} onPress={cambiarModo}>
        <Ionicons name="play-skip-forward-outline" size={20} color="#ff0000ff" style={{ marginRight: 8 }} />
        <Text style={styles.textoModo}>Saltar a {modoDescanso ? 'Enfoque' : 'Descanso'}</Text>
      </PressableScale>
    </View>
  );
}

// --- ESTILOS (dependientes del tema) ---
const crearEstilos = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'space-between' },

    avisoBanner: {
      position: 'absolute',
      top: 10,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      gap: 8,
      zIndex: 10,
    },
    avisoTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

    configPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundElement,
      padding: 8,
      borderRadius: 30,
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    inputGroup: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    label: { color: theme.textSecondary, fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
    input: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 8, minWidth: 25, textAlign: 'center' },
    separador: { width: 1, height: 20, backgroundColor: theme.backgroundSelected },
    botonAplicar: { backgroundColor: theme.text, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 5 },

    relojCard: {
      backgroundColor: theme.backgroundElement,
      padding: 40,
      borderRadius: 40,
      alignItems: 'center',
      width: '100%',
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    titulo: { fontSize: 20, fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
    reloj: { fontSize: 85, fontWeight: '900', color: theme.text, marginBottom: 20 },

    barraTrack: { width: '100%', height: 8, borderRadius: 4, backgroundColor: theme.backgroundSelected, overflow: 'hidden', marginBottom: 30 },
    barraFill: { height: '100%', borderRadius: 4 },

    botonesContainer: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    botonPrincipal: { backgroundColor: theme.text, width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', elevation: 5 },
    botonSecundario: { backgroundColor: theme.background, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

    botonModo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, marginBottom: 30 },
    textoModo: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  });
