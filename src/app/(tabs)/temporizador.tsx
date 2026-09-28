import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';

export default function TemporizadorScreen() {
  const [minutosEstudio, setMinutosEstudio] = useState('25');
  const [minutosDescanso, setMinutosDescanso] = useState('5');

  const [segundosRestantes, setSegundosRestantes] = useState(25 * 60);
  const [activo, setActivo] = useState(false);
  const [modoDescanso, setModoDescanso] = useState(false);

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;
    if (activo && segundosRestantes > 0) {
      intervalo = setInterval(() => setSegundosRestantes((prev) => prev - 1), 1000);
    } else if (activo && segundosRestantes === 0) {
      setActivo(false);
      Vibration.vibrate([0, 500, 200, 500]);
      Alert.alert(modoDescanso ? "¡Descanso terminado!" : "¡Buen trabajo!", modoDescanso ? "A estudiar." : "Toma un respiro.");
      cambiarModo();
    }
    return () => clearInterval(intervalo);
  }, [activo, segundosRestantes]);

  const obtenerTiempos = () => {
    return { estudio: parseInt(minutosEstudio) || 25, descanso: parseInt(minutosDescanso) || 5 };
  };

  const alternarTemporizador = () => setActivo(!activo);

  const reiniciarTemporizador = () => {
    setActivo(false);
    const { estudio, descanso } = obtenerTiempos();
    setSegundosRestantes(modoDescanso ? descanso * 60 : estudio * 60);
  };

  const cambiarModo = () => {
    const { estudio, descanso } = obtenerTiempos();
    const nuevoModo = !modoDescanso;
    setModoDescanso(nuevoModo);
    setSegundosRestantes(nuevoModo ? descanso * 60 : estudio * 60);
    setActivo(false);
  };

  const formatearTiempo = () => {
    const minutos = Math.floor(segundosRestantes / 60);
    const segundos = segundosRestantes % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, modoDescanso ? styles.bgDescanso : styles.bgTrabajo]}>

      {/* Configuración superior estilo Píldora */}
      <View style={styles.configPill}>
        <View style={styles.inputGroup}>
          <Ionicons name="book-outline" size={16} color="#636E72" />
          <TextInput style={styles.input} keyboardType="numeric" value={minutosEstudio} onChangeText={setMinutosEstudio} maxLength={3} />
          <Text style={styles.label}>min</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.inputGroup}>
          <Ionicons name="cafe-outline" size={16} color="#636E72" />
          <TextInput style={styles.input} keyboardType="numeric" value={minutosDescanso} onChangeText={setMinutosDescanso} maxLength={3} />
          <Text style={styles.label}>min</Text>
        </View>
        <TouchableOpacity style={styles.botonAplicar} onPress={reiniciarTemporizador}>
          <Ionicons name="checkmark" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Reloj central en Tarjeta de Vidrio */}
      <View style={styles.relojCard}>
        <Text style={styles.titulo}>{modoDescanso ? 'Descanso' : 'Enfoque'}</Text>
        <Text style={styles.reloj}>{formatearTiempo()}</Text>

        <View style={styles.botonesContainer}>
          <TouchableOpacity style={styles.botonPrincipal} onPress={alternarTemporizador}>
            <Ionicons name={activo ? "pause" : "play"} size={28} color={modoDescanso ? '#55EFC4' : '#FF7675'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonSecundario} onPress={reiniciarTemporizador}>
            <Ionicons name="refresh" size={24} color="#636E72" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón inferior para saltar modo */}
      <TouchableOpacity style={styles.botonModo} onPress={cambiarModo}>
        <Ionicons name="play-skip-forward-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.textoModo}>Saltar a {modoDescanso ? 'Enfoque' : 'Descanso'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- ESTILOS MODERNIZADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'space-between' },
  bgTrabajo: { backgroundColor: '#FF7675' }, // Coral suave
  bgDescanso: { backgroundColor: '#55EFC4' }, // Verde menta suave

  configPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 8, borderRadius: 30, marginTop: 40, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  label: { color: '#636E72', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  input: { fontSize: 16, fontWeight: 'bold', color: '#2D3436', marginLeft: 8, minWidth: 25, textAlign: 'center' },
  separador: { width: 1, height: 20, backgroundColor: '#DFE6E9' },
  botonAplicar: { backgroundColor: '#2D3436', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 5 },

  relojCard: { backgroundColor: '#FFFFFF', padding: 40, borderRadius: 40, alignItems: 'center', width: '100%', elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#636E72', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  reloj: { fontSize: 85, fontWeight: '900', color: '#2D3436', marginBottom: 30 },

  botonesContainer: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  botonPrincipal: { backgroundColor: '#2D3436', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  botonSecundario: { backgroundColor: '#F4F7FC', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  botonModo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, marginBottom: 30 },
  textoModo: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});