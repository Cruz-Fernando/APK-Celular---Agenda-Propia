import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router'; 
import db from '../../../database/db';

interface DatosMateria {
  apuntes: any[];
  tareas: any[];
}

export default function CuadernoScreen() {
  const [datosPorMateria, setDatosPorMateria] = useState<Record<string, DatosMateria>>({});
  
  // Lista exacta sin "Ninguna", para generar solo las tarjetas de las materias reales
  const materiasActivas = ["API", "INGENERIA DE SOFTWARE", "SISTEMAS OPERATIVOS", "SOLUCIONES TECNOLOGICAS CONT", "ECONOMIA", "ETICA", "INFORMATICA JURIDICA"];

  const cargarDatos = () => {
    try {
      // Extraemos todos los apuntes asignados a una materia
      const apuntes = db.getAllSync('SELECT * FROM apuntes WHERE asignatura != "Ninguna" AND asignatura IS NOT NULL') as any[];
      // Extraemos TODAS las tareas de la agenda (pendientes y completadas) para mostrar el historial
      const tareas = db.getAllSync('SELECT * FROM agenda WHERE asignatura != "Ninguna" AND asignatura IS NOT NULL') as any[];

      const datosAgrupados: Record<string, DatosMateria> = {};
      
      materiasActivas.forEach(materia => {
        datosAgrupados[materia] = {
          apuntes: apuntes.filter(a => a.asignatura === materia),
          tareas: tareas.filter(t => t.asignatura === materia)
        };
      });

      setDatosPorMateria(datosAgrupados);
    } catch (error) { console.error('Error al cargar cuaderno:', error); }
  };

  useFocusEffect(
    React.useCallback(() => {
      cargarDatos();
    }, [])
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Mi Cuaderno</Text>
      
      {materiasActivas.map((materia, index) => {
        const datos = datosPorMateria[materia];
        // Oculta la materia si no hay ni apuntes ni tareas registradas en ella
        if (!datos || (datos.apuntes.length === 0 && datos.tareas.length === 0)) return null;

        return (
          <View key={index} style={styles.materiaCard}>
            
            {/* Título de la Materia */}
            <View style={styles.materiaHeader}>
              <Ionicons name="library" size={24} color="#6C5CE7" />
              <Text style={styles.materiaTitulo}>{materia}</Text>
            </View>

            {/* Sub-sección: Agenda (Tareas Pendientes y Completadas) */}
            {datos.tareas.length > 0 && (
              <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>📌 Estado de Tareas</Text>
                {datos.tareas.map(tarea => (
                  <View key={`tarea-${tarea.id}`} style={[styles.itemRow, tarea.estado === 'completada' && styles.itemCompletado]}>
                    <Ionicons 
                      name={tarea.estado === 'completada' ? "checkmark-circle" : "ellipse-outline"} 
                      size={20} 
                      color={tarea.estado === 'completada' ? "#00B894" : "#FF7675"} 
                      style={{ marginTop: 2 }} 
                    />
                    <View style={styles.itemTextContainer}>
                      <Text style={[styles.itemTitulo, tarea.estado === 'completada' && styles.textoTachado]}>
                        {tarea.titulo_tarea}
                      </Text>
                      <Text style={styles.itemSub}>Límite: {tarea.fecha_limite}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Sub-sección: Apuntes */}
            {datos.apuntes.length > 0 && (
              <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>📝 Apuntes de Clase</Text>
                {datos.apuntes.map(apunte => (
                  <View key={`apunte-${apunte.id}`} style={styles.itemRow}>
                    <Ionicons name="document-text" size={20} color="#0984E3" style={{ marginTop: 2 }} />
                    <View style={styles.itemTextContainer}>
                      <Text style={styles.itemTitulo}>{apunte.titulo}</Text>
                      <Text style={styles.itemSub} numberOfLines={1}>{apunte.contenido}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
      
      {/* Espacio extra al final para que el scroll no quede cortado por el menú inferior */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC', paddingHorizontal: 20 },
  header: { fontSize: 32, fontWeight: '900', color: '#2D3436', marginTop: 40, marginBottom: 20 },
  
  materiaCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  materiaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F2F6', paddingBottom: 15 },
  materiaTitulo: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', marginLeft: 10, flex: 1 },
  
  seccion: { marginTop: 10, marginBottom: 5 },
  seccionTitulo: { fontSize: 13, fontWeight: 'bold', color: '#B2BEC3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, backgroundColor: '#F8F9FA', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F2F6' },
  itemCompletado: { backgroundColor: '#FFFFFF', opacity: 0.7, borderColor: '#E8F8F5' },
  itemTextContainer: { marginLeft: 12, flex: 1 },
  itemTitulo: { fontSize: 15, fontWeight: 'bold', color: '#2D3436' },
  textoTachado: { textDecorationLine: 'line-through', color: '#B2BEC3' },
  itemSub: { fontSize: 13, color: '#636E72', marginTop: 3 }
});