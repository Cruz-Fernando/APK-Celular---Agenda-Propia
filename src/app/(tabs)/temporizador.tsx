import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TemporizadorScreen() {
  // --- ESTADOS DEL COMPONENTE ---
  // segundosRestantes: Mantiene el tiempo actual en segundos (25 min = 1500 seg)
  const [segundosRestantes, setSegundosRestantes] = useState(1500);
  
  // activo: Booleano que indica si el temporizador está corriendo o pausado
  const [activo, setActivo] = useState(false);
  
  // modoDescanso: Booleano para saber si estamos en los 25 min de trabajo o 5 min de descanso
  const [modoDescanso, setModoDescanso] = useState(false);

  // --- LÓGICA DEL TEMPORIZADOR (useEffect) ---
  // Este useEffect se ejecuta cada vez que cambia el estado 'activo' o 'segundosRestantes'
  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;

    // Si está activo y aún hay tiempo, restamos 1 segundo cada 1000 milisegundos (1 seg)
    if (activo && segundosRestantes > 0) {
      intervalo = setInterval(() => {
        setSegundosRestantes((segundosPrevios) => segundosPrevios - 1);
      }, 1000);
    } 
    // Si llega a 0, detenemos el temporizador y cambiamos de modo
    else if (segundosRestantes === 0) {
      setActivo(false);
      cambiarModo();
    }

    // Función de limpieza: evita que se acumulen múltiples intervalos en memoria
    return () => clearInterval(intervalo);
  }, [activo, segundosRestantes]);

  // --- FUNCIONES DE CONTROL ---

  // Inicia o pausa el contador
  const alternarTemporizador = () => {
    setActivo(!activo);
  };

  // Reinicia el contador al tiempo por defecto según el modo actual
  const reiniciarTemporizador = () => {
    setActivo(false);
    setSegundosRestantes(modoDescanso ? 300 : 1500); // 300 = 5 min, 1500 = 25 min
  };

  // Alterna entre modo Trabajo (25 min) y modo Descanso (5 min)
  const cambiarModo = () => {
    const nuevoModo = !modoDescanso;
    setModoDescanso(nuevoModo);
    setSegundosRestantes(nuevoModo ? 300 : 1500);
    setActivo(false); // Siempre pausamos al cambiar de modo
  };

  // --- FORMATEO DE TIEMPO ---
  // Convierte los segundos brutos a formato MM:SS (Ej: 1500 -> "25:00")
  const formatearTiempo = () => {
    const minutos = Math.floor(segundosRestantes / 60);
    const segundos = segundosRestantes % 60;
    // padStart asegura que siempre haya 2 dígitos (ej. "05" en vez de "5")
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  // --- INTERFAZ GRÁFICA ---
  return (
    <View style={[styles.container, modoDescanso ? styles.bgDescanso : styles.bgTrabajo]}>
      {/* Título dinámico que cambia según el modo */}
      <Text style={styles.titulo}>{modoDescanso ? 'Tiempo de Descanso' : 'Tiempo de Estudio'}</Text>
      
      {/* Reloj central con el tiempo formateado */}
      <Text style={styles.reloj}>{formatearTiempo()}</Text>
      
      {/* Controles principales: Iniciar/Pausar y Reiniciar */}
      <View style={styles.botonesContainer}>
        <TouchableOpacity style={styles.boton} onPress={alternarTemporizador}>
          <Text style={styles.textoBoton}>{activo ? 'Pausar' : 'Iniciar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.boton, styles.botonSecundario]} onPress={reiniciarTemporizador}>
          <Text style={styles.textoBotonSecundario}>Reiniciar</Text>
        </TouchableOpacity>
      </View>

      {/* Botón inferior para saltar al otro modo manualmente */}
      <TouchableOpacity style={styles.botonModo} onPress={cambiarModo}>
        <Text style={styles.textoModo}>
          Cambiar a {modoDescanso ? 'Estudio (25m)' : 'Descanso (5m)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  // Fondos diferentes para identificar visualmente en qué modo estamos
  bgTrabajo: { backgroundColor: '#FF6B6B' }, // Rojo suave para estudio
  bgDescanso: { backgroundColor: '#4ECDC4' }, // Verde suave para descanso
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
  reloj: { fontSize: 80, fontWeight: 'bold', color: '#FFF', marginBottom: 40 },
  botonesContainer: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  boton: { backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 3 },
  botonSecundario: { backgroundColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 2, borderColor: '#FFF' },
  textoBoton: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  textoBotonSecundario: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  botonModo: { padding: 10 },
  textoModo: { color: '#FFF', fontSize: 16, textDecorationLine: 'underline' }
});