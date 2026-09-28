import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Alert, TextInput } from 'react-native';

export default function TemporizadorScreen() {
  // --- ESTADOS DE CONFIGURACIÓN ---
  // Almacenan la preferencia del usuario en texto para vincularlos a los inputs.
  const [minutosEstudio, setMinutosEstudio] = useState('25');
  const [minutosDescanso, setMinutosDescanso] = useState('5');

  // --- ESTADOS DEL TEMPORIZADOR ---
  // Por defecto, inicializamos en 25 minutos (25 * 60 = 1500 segundos)
  const [segundosRestantes, setSegundosRestantes] = useState(25 * 60);
  const [activo, setActivo] = useState(false);
  const [modoDescanso, setModoDescanso] = useState(false);

  // --- LÓGICA PRINCIPAL (RELOJ Y ALARMAS) ---
  useEffect(() => {
    // Usamos el tipo correcto para React Native que tú mismo corregiste
    let intervalo: ReturnType<typeof setInterval>;

    // Si está activo y queda tiempo, descontamos 1 segundo
    if (activo && segundosRestantes > 0) {
      intervalo = setInterval(() => {
        setSegundosRestantes((prev) => prev - 1);
      }, 1000);
    } 
    // Si está activo pero el tiempo llegó a 0 (¡Finalizó el ciclo!)
    else if (activo && segundosRestantes === 0) {
      // 1. Detenemos el reloj
      setActivo(false);
      
      // 2. Hacemos vibrar el celular: [espera, vibra, espera, vibra] en milisegundos
      const patronVibracion = [0, 500, 200, 500]; 
      Vibration.vibrate(patronVibracion);

      // 3. Mostramos una alerta en pantalla según el modo que acaba de terminar
      if (modoDescanso) {
        Alert.alert("¡Descanso terminado!", "Es hora de volver a concentrarse.");
      } else {
        Alert.alert("¡Buen trabajo!", "Tu tiempo de estudio terminó. Toma un respiro.");
      }

      // 4. Cambiamos automáticamente al siguiente modo
      cambiarModo();
    }

    // Limpiamos el intervalo al desmontar o actualizar
    return () => clearInterval(intervalo);
  }, [activo, segundosRestantes]);

  // --- FUNCIONES DE CONTROL ---

  // Obtiene los valores seguros de los inputs. Si el usuario deja el campo vacío, usamos un valor por defecto.
  const obtenerTiemposConfigurados = () => {
    const tiempoEstudio = parseInt(minutosEstudio) || 25; // Si no hay número válido, usa 25
    const tiempoDescanso = parseInt(minutosDescanso) || 5;  // Si no hay número válido, usa 5
    return { tiempoEstudio, tiempoDescanso };
  };

  // Alterna entre iniciar y pausar el reloj
  const alternarTemporizador = () => {
    setActivo(!activo);
  };

  // Detiene el reloj y lo devuelve al tiempo original según la configuración actual
  const reiniciarTemporizador = () => {
    setActivo(false);
    const { tiempoEstudio, tiempoDescanso } = obtenerTiemposConfigurados();
    // Multiplicamos por 60 para convertir los minutos ingresados a segundos
    setSegundosRestantes(modoDescanso ? tiempoDescanso * 60 : tiempoEstudio * 60);
  };

  // Pasa de Estudio a Descanso y viceversa, aplicando los tiempos configurados
  const cambiarModo = () => {
    const { tiempoEstudio, tiempoDescanso } = obtenerTiemposConfigurados();
    const nuevoModo = !modoDescanso;
    
    setModoDescanso(nuevoModo);
    setSegundosRestantes(nuevoModo ? tiempoDescanso * 60 : tiempoEstudio * 60);
    setActivo(false);
  };

  // Aplica los cambios escritos en los inputs inmediatamente al reloj
  const aplicarConfiguracion = () => {
    reiniciarTemporizador();
  };

  // Formatea los segundos para que se vean como un reloj digital (MM:SS)
  const formatearTiempo = () => {
    const minutos = Math.floor(segundosRestantes / 60);
    const segundos = segundosRestantes % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  // --- INTERFAZ GRÁFICA ---
  return (
    <View style={[styles.container, modoDescanso ? styles.bgDescanso : styles.bgTrabajo]}>
      
      {/* SECCIÓN 1: Configuración de tiempos */}
      <View style={styles.configContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estudio (min):</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric" // Muestra el teclado numérico en el celular
            value={minutosEstudio}
            onChangeText={setMinutosEstudio}
            maxLength={3}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descanso (min):</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={minutosDescanso}
            onChangeText={setMinutosDescanso}
            maxLength={3}
          />
        </View>

        <TouchableOpacity style={styles.botonAplicar} onPress={aplicarConfiguracion}>
          <Text style={styles.textoBotonAplicar}>Aplicar</Text>
        </TouchableOpacity>
      </View>

      {/* SECCIÓN 2: El Reloj y sus controles */}
      <View style={styles.relojContainer}>
        <Text style={styles.titulo}>{modoDescanso ? 'Tiempo de Descanso' : 'Tiempo de Estudio'}</Text>
        <Text style={styles.reloj}>{formatearTiempo()}</Text>
        
        <View style={styles.botonesContainer}>
          <TouchableOpacity style={styles.boton} onPress={alternarTemporizador}>
            <Text style={styles.textoBoton}>{activo ? 'Pausar' : 'Iniciar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={reiniciarTemporizador}>
            <Text style={styles.textoBotonSecundario}>Reiniciar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.botonModo} onPress={cambiarModo}>
          <Text style={styles.textoModo}>
            Saltar a {modoDescanso ? 'Estudio' : 'Descanso'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  bgTrabajo: { backgroundColor: '#FF6B6B' }, 
  bgDescanso: { backgroundColor: '#4ECDC4' },
  
  // Estilos de la caja superior de configuración
  configContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 12, marginTop: 30 },
  inputGroup: { flex: 1, marginRight: 10 },
  label: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  input: { backgroundColor: '#FFF', padding: 8, borderRadius: 6, textAlign: 'center', fontSize: 16, color: '#333' },
  botonAplicar: { backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 6, height: 40, justifyContent: 'center' },
  textoBotonAplicar: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  
  // Estilos centrales del reloj
  relojContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
  reloj: { fontSize: 80, fontWeight: 'bold', color: '#FFF', marginBottom: 40 },
  
  // Estilos de botones
  botonesContainer: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  boton: { backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 3 },
  botonSecundario: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FFF' },
  textoBoton: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  textoBotonSecundario: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  botonModo: { padding: 10 },
  textoModo: { color: '#FFF', fontSize: 16, textDecorationLine: 'underline' }
});