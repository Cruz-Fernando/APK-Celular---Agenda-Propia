import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker'; 
import * as ImagePicker from 'expo-image-picker'; 
import * as DocumentPicker from 'expo-document-picker'; 
import db from '../../../database/db';

interface Tarea {
  id: number;
  titulo_tarea: string;
  descripcion?: string;
  fecha_limite: string | null;
  asignatura?: string;
  etiqueta_personal?: string;
  archivo_uri?: string;
  archivo_nombre?: string;
  estado: 'pendiente' | 'completada';
}

export default function AgendaScreen() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [asignatura, setAsignatura] = useState('Ninguna');
  const [etiquetaPersonal, setEtiquetaPersonal] = useState('');
  const [fechaLimite, setFechaLimite] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ uri: string; nombre: string } | null>(null);

  const opcionesAsignaturas = ["Ninguna", "Ingeniería de Software", "Sistemas Operativos", "Economía", "Ética", "Otra"];

  const adjuntarImagen = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setArchivoAdjunto({ uri: result.assets[0].uri, nombre: 'Imagen_Adjunta.jpg' });
    }
  };

  const adjuntarDocumento = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setArchivoAdjunto({ uri: result.assets[0].uri, nombre: result.assets[0].name });
    }
  };

  const removerAdjunto = () => setArchivoAdjunto(null);
  const formatearFecha = (fecha: Date) => `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
  const alCambiarFecha = (event: any, fechaSeleccionada?: Date) => { setMostrarCalendario(false); if (fechaSeleccionada) setFechaLimite(fechaSeleccionada); };

  const cargarTareas = () => {
    try {
      const resultados = db.getAllSync('SELECT * FROM agenda ORDER BY id DESC') as Tarea[];
      setTareas(resultados);
    } catch (error) { console.error('Error:', error); }
  };

  useEffect(() => { cargarTareas(); }, []);

  const agregarTarea = () => {
    if (!titulo.trim()) return;
    try {
      db.runSync(
        `INSERT INTO agenda (titulo_tarea, descripcion, fecha_limite, asignatura, etiqueta_personal, archivo_uri, archivo_nombre, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descripcion, formatearFecha(fechaLimite), asignatura, etiquetaPersonal, archivoAdjunto?.uri || null, archivoAdjunto?.nombre || null, 'pendiente']
      );
      setTitulo(''); setDescripcion(''); setAsignatura('Ninguna'); setEtiquetaPersonal(''); setFechaLimite(new Date()); setArchivoAdjunto(null);
      cargarTareas();
    } catch (error) { console.error('Error:', error); }
  };

  const cambiarEstado = (id: number, estadoActual: string) => {
    db.runSync('UPDATE agenda SET estado = ? WHERE id = ?', [estadoActual === 'pendiente' ? 'completada' : 'pendiente', id]);
    cargarTareas();
  };

  const eliminarTarea = (id: number) => {
    db.runSync('DELETE FROM agenda WHERE id = ?', [id]);
    cargarTareas();
  };

  const FormularioCabecera = () => (
    <View style={styles.formContainer}>
      <Text style={styles.header}>Mi Agenda</Text>
      
      <TextInput style={styles.input} placeholder="¿Qué necesitas hacer? *" placeholderTextColor="#B2BEC3" value={titulo} onChangeText={setTitulo} />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Añade detalles..." placeholderTextColor="#B2BEC3" value={descripcion} onChangeText={setDescripcion} multiline />
      
      <View style={styles.pickerContainer}>
        <Text style={styles.labelPicker}>Asignatura</Text>
        <Picker selectedValue={asignatura} onValueChange={setAsignatura} style={styles.picker}>
          {opcionesAsignaturas.map((opc, i) => <Picker.Item key={i} label={opc} value={opc} color="#2D3436" />)}
        </Picker>
      </View>

      <TextInput style={styles.input} placeholder="Etiqueta (Ej: Proyecto)" placeholderTextColor="#B2BEC3" value={etiquetaPersonal} onChangeText={setEtiquetaPersonal} />

      <View style={styles.accionesRow}>
        <TouchableOpacity style={styles.botonFecha} onPress={() => setMostrarCalendario(true)}>
          <Ionicons name="calendar" size={18} color="#0984E3" />
          <Text style={styles.textoBotonFecha}>{formatearFecha(fechaLimite)}</Text>
        </TouchableOpacity>

        <View style={styles.adjuntosRow}>
          <TouchableOpacity style={styles.botonIcono} onPress={adjuntarImagen}>
            <Ionicons name="image" size={22} color="#636E72" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonIcono} onPress={adjuntarDocumento}>
            <Ionicons name="document-attach" size={22} color="#636E72" />
          </TouchableOpacity>
        </View>
      </View>

      {archivoAdjunto && (
        <View style={styles.archivoBadge}>
          <Ionicons name="attach" size={16} color="#2D3436" />
          <Text style={styles.archivoNombre} numberOfLines={1}>{archivoAdjunto.nombre}</Text>
          <TouchableOpacity onPress={removerAdjunto}><Ionicons name="close-circle" size={20} color="#FF7675" /></TouchableOpacity>
        </View>
      )}

      {mostrarCalendario && <DateTimePicker value={fechaLimite} mode="date" display="default" onChange={alCambiarFecha} />}

      <TouchableOpacity style={styles.botonGuardar} onPress={agregarTarea}>
        <Text style={styles.textoBotonGuardar}>Añadir Tarea</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <FlatList
        data={tareas}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={FormularioCabecera}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.tarjetaTarea, item.estado === 'completada' && styles.tareaCompletada]}>
            <TouchableOpacity onPress={() => cambiarEstado(item.id, item.estado)} style={styles.checkbox}>
              <Ionicons name={item.estado === 'completada' ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={item.estado === 'completada' ? '#00B894' : '#DFE6E9'} />
            </TouchableOpacity>

            <View style={styles.infoTarea}>
              <Text style={[styles.tituloTarea, item.estado === 'completada' && styles.textoTachado]}>{item.titulo_tarea}</Text>
              {item.descripcion ? <Text style={styles.descripcionTarea} numberOfLines={2}>{item.descripcion}</Text> : null}
              
              <View style={styles.etiquetasContainer}>
                {item.fecha_limite && <View style={styles.pillFecha}><Text style={styles.textoPillFecha}>{item.fecha_limite}</Text></View>}
                {item.asignatura && item.asignatura !== "Ninguna" && <View style={styles.pillAsignatura}><Text style={styles.textoPillAsignatura}>{item.asignatura}</Text></View>}
                {item.etiqueta_personal ? <View style={styles.pillPersonal}><Text style={styles.textoPillPersonal}>{item.etiqueta_personal}</Text></View> : null}
              </View>

              {item.archivo_uri && (
                <View style={styles.indicadorArchivo}>
                  <Ionicons name="document-text" size={14} color="#0984E3" />
                  <Text style={styles.textoIndicadorArchivo}>{item.archivo_nombre}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={() => eliminarTarea(item.id)} style={styles.btnEliminar}>
              <Ionicons name="trash-outline" size={22} color="#FF7675" />
            </TouchableOpacity>
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
  textArea: { height: 80, textAlignVertical: 'top' },
  
  pickerContainer: { backgroundColor: '#F8F9FA', borderRadius: 12, marginBottom: 12, paddingHorizontal: 12, paddingTop: 8 },
  labelPicker: { fontSize: 11, color: '#B2BEC3', fontWeight: 'bold', textTransform: 'uppercase' },
  picker: { height: 45, width: '100%', color: '#2D3436' },

  accionesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  botonFecha: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1F0FF', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, flex: 1, marginRight: 10 },
  textoBotonFecha: { color: '#0984E3', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },
  adjuntosRow: { flexDirection: 'row', gap: 10 },
  botonIcono: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  
  archivoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F2F6', padding: 12, borderRadius: 10, marginBottom: 15 },
  archivoNombre: { flex: 1, fontSize: 13, color: '#2D3436', marginHorizontal: 8, fontWeight: '500' },
  
  botonGuardar: { backgroundColor: '#2D3436', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  textoBotonGuardar: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  tarjetaTarea: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  tareaCompletada: { opacity: 0.6 },
  checkbox: { marginRight: 12, marginTop: 2 },
  infoTarea: { flex: 1 },
  tituloTarea: { fontSize: 17, fontWeight: 'bold', color: '#2D3436', marginBottom: 4 },
  descripcionTarea: { fontSize: 14, color: '#636E72', marginBottom: 10 },
  textoTachado: { textDecorationLine: 'line-through', color: '#B2BEC3' },
  
  etiquetasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pillFecha: { backgroundColor: '#FFEAA7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  textoPillFecha: { fontSize: 11, fontWeight: 'bold', color: '#D35400' },
  pillAsignatura: { backgroundColor: '#E1F0FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  textoPillAsignatura: { fontSize: 11, fontWeight: 'bold', color: '#0984E3' },
  pillPersonal: { backgroundColor: '#DFE6E9', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  textoPillPersonal: { fontSize: 11, fontWeight: 'bold', color: '#2D3436' },
  
  indicadorArchivo: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#F8F9FA', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' },
  textoIndicadorArchivo: { fontSize: 12, color: '#0984E3', marginLeft: 6, fontWeight: '600' },
  btnEliminar: { padding: 4, marginLeft: 8 }
});