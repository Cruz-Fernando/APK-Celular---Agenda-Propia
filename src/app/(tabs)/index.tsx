import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import db from '../../../database/db'; 

interface Apunte {
  id: number;
  titulo: string;
  contenido: string;
  fecha_creacion: string;
}

export default function ApuntesScreen() {
  const [apuntes, setApuntes] = useState<Apunte[]>([]);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  const cargarApuntes = () => {
    try {
      const resultados = db.getAllSync('SELECT * FROM apuntes ORDER BY id DESC') as Apunte[];
      setApuntes(resultados);
    } catch (error) {
      console.error('Error al cargar apuntes:', error);
    }
  };

  useEffect(() => { cargarApuntes(); }, []);

  const guardarApunte = () => {
    if (!titulo.trim()) return;
    try {
      db.runSync('INSERT INTO apuntes (titulo, contenido) VALUES (?, ?)', [titulo, contenido]);
      setTitulo(''); 
      setContenido('');
      cargarApuntes(); 
    } catch (error) {
      console.error('Error al guardar el apunte:', error);
    }
  };

  const eliminarApunte = (id: number) => {
    db.runSync('DELETE FROM apuntes WHERE id = ?', [id]);
    cargarApuntes();
  };

  const FormularioApunte = () => (
    <View style={styles.formContainer}>
      <Text style={styles.header}>Mis Apuntes</Text>
      <TextInput
        style={styles.input}
        placeholder="Título del apunte..."
        placeholderTextColor="#999"
        value={titulo}
        onChangeText={setTitulo}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Escribe el contenido aquí..."
        placeholderTextColor="#999"
        value={contenido}
        onChangeText={setContenido}
        multiline
      />
      <TouchableOpacity style={styles.botonGuardar} onPress={guardarApunte}>
        <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.textoBoton}>Guardar Apunte</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <FlatList
        data={apuntes}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={FormularioApunte}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.tarjetaApunte}>
            <View style={styles.cabeceraTarjeta}>
              <Text style={styles.tituloApunte}>{item.titulo}</Text>
              <TouchableOpacity onPress={() => eliminarApunte(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#FF7675" />
              </TouchableOpacity>
            </View>
            <Text style={styles.contenidoApunte}>{item.contenido}</Text>
            <Text style={styles.fechaApunte}>{item.fecha_creacion}</Text>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

// --- ESTILOS MODERNIZADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC', paddingHorizontal: 20 },
  formContainer: { marginTop: 40, marginBottom: 20 },
  header: { fontSize: 32, fontWeight: '900', color: '#2D3436', marginBottom: 20 },
  
  input: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, fontSize: 16, color: '#2D3436', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  textArea: { height: 120, textAlignVertical: 'top' },
  
  botonGuardar: { flexDirection: 'row', backgroundColor: '#6C5CE7', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#6C5CE7', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, marginTop: 5 },
  textoBoton: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  tarjetaApunte: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, borderLeftWidth: 4, borderLeftColor: '#6C5CE7' },
  cabeceraTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tituloApunte: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', flex: 1, paddingRight: 10 },
  contenidoApunte: { fontSize: 15, color: '#636E72', marginBottom: 12, lineHeight: 22 },
  fechaApunte: { fontSize: 12, color: '#B2BEC3', textAlign: 'right', fontWeight: '600' }
});