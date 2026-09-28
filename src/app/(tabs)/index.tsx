import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; 
import db from '../../../database/db'; 

interface Apunte {
  id: number;
  titulo: string;
  contenido: string;
  fecha_creacion: string;
  asignatura?: string;
}

export default function ApuntesScreen() {
  const [apuntes, setApuntes] = useState<Apunte[]>([]);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [asignatura, setAsignatura] = useState('Ninguna');
  
  // Lista unificada de tus asignaturas
  const opcionesAsignaturas = ["Ninguna", "API", "INGENERIA DE SOFTWARE", "SISTEMAS OPERATIVOS", "SOLUCIONES TECNOLOGICAS CONT", "ECONOMIA", "ETICA", "INFORMATICA JURIDICA"];

  const cargarApuntes = () => {
    try {
      const resultados = db.getAllSync('SELECT * FROM apuntes ORDER BY id DESC') as Apunte[];
      setApuntes(resultados);
    } catch (error) { console.error('Error al cargar apuntes:', error); }
  };

  useEffect(() => { cargarApuntes(); }, []);

  const guardarApunte = () => {
    if (!titulo.trim()) return;
    try {
      db.runSync('INSERT INTO apuntes (titulo, contenido, asignatura) VALUES (?, ?, ?)', [titulo, contenido, asignatura]);
      setTitulo(''); 
      setContenido('');
      setAsignatura('Ninguna');
      cargarApuntes(); 
    } catch (error) { console.error('Error:', error); }
  };

  const eliminarApunte = (id: number) => {
    db.runSync('DELETE FROM apuntes WHERE id = ?', [id]);
    cargarApuntes();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <FlatList
        data={apuntes}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.formContainer}>
            <Text style={styles.header}>Mis Apuntes</Text>
            
            <TextInput style={styles.input} placeholder="Título del apunte..." placeholderTextColor="#B2BEC3" value={titulo} onChangeText={setTitulo} />
            
            <View style={styles.pickerContainer}>
              <Text style={styles.labelPicker}>Asignatura</Text>
              <Picker selectedValue={asignatura} onValueChange={setAsignatura} style={styles.picker}>
                {opcionesAsignaturas.map((opc, i) => <Picker.Item key={i} label={opc} value={opc} color="#2D3436" />)}
              </Picker>
            </View>

            <TextInput style={[styles.input, styles.textArea]} placeholder="Escribe el contenido aquí..." placeholderTextColor="#B2BEC3" value={contenido} onChangeText={setContenido} multiline />
            
            <TouchableOpacity style={styles.botonGuardar} onPress={guardarApunte}>
              <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.textoBoton}>Guardar Apunte</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tarjetaApunte}>
            <View style={styles.cabeceraTarjeta}>
              <Text style={styles.tituloApunte}>{item.titulo}</Text>
              <TouchableOpacity onPress={() => eliminarApunte(item.id)}>
                <Ionicons name="trash-outline" size={22} color="#FF7675" />
              </TouchableOpacity>
            </View>
            <Text style={styles.contenidoApunte}>{item.contenido}</Text>
            
            <View style={styles.pieTarjeta}>
              {item.asignatura && item.asignatura !== "Ninguna" && (
                <View style={styles.pillAsignatura}><Text style={styles.textoPill}>{item.asignatura}</Text></View>
              )}
              <Text style={styles.fechaApunte}>{item.fecha_creacion}</Text>
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC', paddingHorizontal: 20 },
  formContainer: { marginTop: 40, marginBottom: 20, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  header: { fontSize: 28, fontWeight: '900', color: '#2D3436', marginBottom: 20 },
  input: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 15, color: '#2D3436' },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#F8F9FA', borderRadius: 12, marginBottom: 12, paddingHorizontal: 12, paddingTop: 8 },
  labelPicker: { fontSize: 11, color: '#B2BEC3', fontWeight: 'bold', textTransform: 'uppercase' },
  picker: { height: 45, width: '100%', color: '#2D3436' },
  botonGuardar: { flexDirection: 'row', backgroundColor: '#6C5CE7', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  textoBoton: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  tarjetaApunte: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, borderLeftWidth: 4, borderLeftColor: '#6C5CE7' },
  cabeceraTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tituloApunte: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', flex: 1, paddingRight: 10 },
  contenidoApunte: { fontSize: 15, color: '#636E72', marginBottom: 12, lineHeight: 22 },
  pieTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fechaApunte: { fontSize: 12, color: '#B2BEC3', fontWeight: '600' },
  pillAsignatura: { backgroundColor: '#E1F0FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  textoPill: { fontSize: 11, fontWeight: 'bold', color: '#0984E3' }
});