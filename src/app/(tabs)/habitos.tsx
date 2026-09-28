import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../../../database/db';

import { useTheme } from '@/hooks/use-theme';
import Reveal from '@/components/Reveal';
import PressableScale from '@/components/PressableScale';

interface Habito {
  id: number;
  nombre: string;
  frecuencia: string;
  racha_actual: number;
  mejor_racha: number;
  completadoHoy?: boolean;
}

export default function HabitosScreen() {
  const theme = useTheme();
  const styles = crearEstilos(theme);

  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [nuevoHabito, setNuevoHabito] = useState('');

  const obtenerFechaHoy = () => {
    const fecha = new Date();
    return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
  };

  const cargarHabitos = () => {
    try {
      const hoy = obtenerFechaHoy();
      const listaHabitos = db.getAllSync('SELECT * FROM habitos ORDER BY id DESC') as Habito[];
      const registrosHoy = db.getAllSync('SELECT habito_id FROM registros_habitos WHERE fecha = ?', [hoy]) as any[];
      const idsCompletados = registrosHoy.map(registro => registro.habito_id);

      const habitosConEstado = listaHabitos.map(habito => ({
        ...habito,
        completadoHoy: idsCompletados.includes(habito.id)
      }));
      setHabitos(habitosConEstado);
    } catch (error) { console.error('Error:', error); }
  };

  useEffect(() => { cargarHabitos(); }, []);

  const agregarHabito = () => {
    if (!nuevoHabito.trim()) return;
    try {
      db.runSync('INSERT INTO habitos (nombre, frecuencia, racha_actual, mejor_racha) VALUES (?, ?, ?, ?)', [nuevoHabito, 'Diaria', 0, 0]);
      setNuevoHabito('');
      cargarHabitos();
    } catch (error) { console.error('Error:', error); }
  };

  const alternarHabitoHoy = (habito: Habito) => {
    const hoy = obtenerFechaHoy();
    try {
      if (habito.completadoHoy) {
        db.runSync('DELETE FROM registros_habitos WHERE habito_id = ? AND fecha = ?', [habito.id, hoy]);
        const nuevaRacha = Math.max(0, habito.racha_actual - 1);
        db.runSync('UPDATE habitos SET racha_actual = ? WHERE id = ?', [nuevaRacha, habito.id]);
      } else {
        db.runSync('INSERT INTO registros_habitos (habito_id, fecha, completado) VALUES (?, ?, ?)', [habito.id, hoy, 1]);
        const nuevaRacha = habito.racha_actual + 1;
        const nuevaMejorRacha = nuevaRacha > habito.mejor_racha ? nuevaRacha : habito.mejor_racha;
        db.runSync('UPDATE habitos SET racha_actual = ?, mejor_racha = ? WHERE id = ?', [nuevaRacha, nuevaMejorRacha, habito.id]);
      }
      cargarHabitos();
    } catch (error) { console.error('Error:', error); }
  };

  const eliminarHabito = (id: number) => {
    db.runSync('DELETE FROM registros_habitos WHERE habito_id = ?', [id]);
    db.runSync('DELETE FROM habitos WHERE id = ?', [id]);
    cargarHabitos();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <FlatList
        data={habitos}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        // SOLUCIÓN AL BUG DEL TECLADO:
        ListHeaderComponent={
          <Reveal style={styles.formContainer}>
            <Text style={styles.header}>Mis Hábitos</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Nuevo hábito..."
                placeholderTextColor={theme.textSecondary}
                value={nuevoHabito}
                onChangeText={setNuevoHabito}
              />
              <PressableScale style={styles.botonCrear} onPress={agregarHabito}>
                <Ionicons name="add" size={24} color="#FFF" />
              </PressableScale>
            </View>
          </Reveal>
        }
        renderItem={({ item, index }) => (
          <Reveal delay={Math.min(index, 6) * 50}>
            <View style={[styles.tarjetaHabito, item.completadoHoy && styles.habitoCompletadoOpacity]}>
              <View style={styles.infoHabito}>
                <View style={styles.tituloRow}>
                  <Text style={styles.tituloHabito}>{item.nombre}</Text>
                  <TouchableOpacity onPress={() => eliminarHabito(item.id)}>
                    <Ionicons name="close" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.rachasContainer}>
                  <View style={styles.pillRacha}>
                    <Ionicons name="flame" size={14} color="#E17055" style={{ marginRight: 4 }} />
                    <Text style={styles.textoRacha}>{item.racha_actual}</Text>
                  </View>
                  <View style={styles.pillMejorRacha}>
                    <Ionicons name="trophy" size={14} color="#FDCB6E" style={{ marginRight: 4 }} />
                    <Text style={styles.textoMejorRacha}>{item.mejor_racha}</Text>
                  </View>
                </View>
              </View>

              <PressableScale
                style={[styles.botonCheck, item.completadoHoy && styles.botonCheckActivo]}
                onPress={() => alternarHabitoHoy(item)}
                scaleTo={0.85}
              >
                <Ionicons name="checkmark" size={32} color={item.completadoHoy ? "#FFF" : theme.backgroundSelected} />
              </PressableScale>
            </View>
          </Reveal>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const crearEstilos = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20 },
  formContainer: { marginTop: 40, marginBottom: 20 },
  header: { fontSize: 32, fontWeight: '900', color: theme.text, marginBottom: 20 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, backgroundColor: theme.backgroundElement, padding: 16, borderRadius: 16, fontSize: 16, color: theme.text, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  botonCrear: { backgroundColor: '#00B894', width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#00B894', shadowOpacity: 0.3, shadowRadius: 8 },

  tarjetaHabito: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundElement, padding: 20, borderRadius: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  habitoCompletadoOpacity: { opacity: 0.8 },

  infoHabito: { flex: 1, marginRight: 15 },
  tituloRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  tituloHabito: { fontSize: 18, fontWeight: 'bold', color: theme.text, flex: 1 },

  rachasContainer: { flexDirection: 'row', gap: 10 },
  pillRacha: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEAA7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  textoRacha: { fontSize: 13, fontWeight: 'bold', color: '#D35400' },
  pillMejorRacha: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  textoMejorRacha: { fontSize: 13, fontWeight: 'bold', color: '#E67E22' },

  botonCheck: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.background, borderWidth: 2, borderColor: theme.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  botonCheckActivo: { backgroundColor: '#00B894', borderColor: '#00B894', elevation: 4, shadowColor: '#00B894', shadowOpacity: 0.4, shadowRadius: 8 },
});
