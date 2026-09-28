import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import db from '../../../database/db'; 

// 1. Definimos la forma exacta que tiene un "Apunte" en nuestra base de datos
interface Apunte {
  id: number;
  titulo: string;
  contenido: string;
  fecha_creacion: string;
  etiquetas?: string; 
}

export default function ApuntesScreen() {
  // 2. Estado tipado para los apuntes
  const [apuntes, setApuntes] = useState<Apunte[]>([]);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  // 3. Función para leer los apuntes de la base de datos
  const cargarApuntes = () => {
    try {
      const resultados = db.getAllSync('SELECT * FROM apuntes ORDER BY id DESC') as Apunte[];
      setApuntes(resultados);
    } catch (error) {
      console.error('Error al cargar apuntes:', error);
    }
  };

  // 4. Cargar datos al abrir la pantalla
  useEffect(() => {
    cargarApuntes();
  }, []);

  // 5. Función para insertar un nuevo apunte
  const guardarApunte = () => {
    if (!titulo.trim()) return; // Evita guardar si no hay título

    try {
      db.runSync('INSERT INTO apuntes (titulo, contenido) VALUES (?, ?)', [titulo, contenido]);
      setTitulo(''); // Limpiamos los campos
      setContenido('');
      cargarApuntes(); // Refrescamos la lista para ver el nuevo apunte
    } catch (error) {
      console.error('Error al guardar el apunte:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Apuntes</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Título del apunte..."
          value={titulo}
          onChangeText={setTitulo}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escribe el contenido aquí..."
          value={contenido}
          onChangeText={setContenido}
          multiline
        />
        <TouchableOpacity style={styles.boton} onPress={guardarApunte}>
          <Text style={styles.textoBoton}>Guardar Apunte</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={apuntes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.tarjetaApunte}>
            <Text style={styles.tituloApunte}>{item.titulo}</Text>
            <Text style={styles.contenidoApunte}>{item.contenido}</Text>
            <Text style={styles.fechaApunte}>{item.fecha_creacion}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  inputContainer: { marginBottom: 20 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 100, textAlignVertical: 'top' },
  boton: { backgroundColor: '#007BFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  textoBoton: { color: '#fff', fontWeight: 'bold' },
  tarjetaApunte: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  tituloApunte: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  contenidoApunte: { fontSize: 14, color: '#555', marginBottom: 8 },
  fechaApunte: { fontSize: 11, color: '#999', textAlign: 'right' }
});