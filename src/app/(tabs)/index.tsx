import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; 
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import {
  useAudioRecorder,
  useAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import db from '../../../database/db'; 

interface Apunte {
  id: number;
  titulo: string;
  contenido: string;
  fecha_creacion: string;
  asignatura?: string;
  archivo_uri?: string;
  archivo_nombre?: string;
  audio_uri?: string;
}

export default function ApuntesScreen() {
  // Estados de la lista
  const [apuntes, setApuntes] = useState<Apunte[]>([]);
  
  // Estados del Formulario / Edición
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [asignatura, setAsignatura] = useState('Ninguna');
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ uri: string; nombre: string } | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  
  // Estados para Audio (expo-audio)
  const [grabando, setGrabando] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(null);

  // Estados del Modal (Ver Detalles / Editar)
  const [modalVisible, setModalVisible] = useState(false);
  const [apunteActivo, setApunteActivo] = useState<Apunte | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const opcionesAsignaturas = ["Ninguna", "API", "INGENERIA DE SOFTWARE", "SISTEMAS OPERATIVOS", "SOLUCIONES TECNOLOGICAS CONT", "ECONOMIA", "ETICA", "INFORMATICA JURIDICA"];

  const cargarApuntes = () => {
    try {
      const resultados = db.getAllSync('SELECT * FROM apuntes ORDER BY id DESC') as Apunte[];
      setApuntes(resultados);
    } catch (error) { console.error('Error al cargar:', error); }
  };

  useEffect(() => { cargarApuntes(); }, []);

  // --- FUNCIONES DE HERRAMIENTAS ---

  const pegarDesdePortapapeles = async () => {
    const texto = await Clipboard.getStringAsync();
    setContenido(prev => prev + (prev ? '\n' : '') + texto);
  };

  const adjuntarTXT = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: 'text/plain', copyToCacheDirectory: true });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setArchivoAdjunto({ uri: result.assets[0].uri, nombre: result.assets[0].name });
    }
  };

  const iniciarGrabacion = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        console.warn('Permiso de micrófono denegado');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setGrabando(true);
    } catch (err) { console.error('Error al grabar', err); }
  };

  const detenerGrabacion = async () => {
    if (!grabando) return;
    try {
      await recorder.stop();
      setGrabando(false);
      setAudioUri(recorder.uri ?? null);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch (err) {
      setGrabando(false);
      console.error('Error al detener la grabación', err);
    }
  };

  const reproducirAudio = (uri: string) => {
    try {
      player.replace({ uri });
      player.play();
    } catch (error) { console.error('Error al reproducir', error); }
  };

  // --- FUNCIONES DE BASE DE DATOS ---

  const resetearFormulario = () => {
    setTitulo(''); setContenido(''); setAsignatura('Ninguna'); 
    setArchivoAdjunto(null); setAudioUri(null);
  };

  const guardarApunte = () => {
    if (!titulo.trim()) return;
    try {
      db.runSync(
        'INSERT INTO apuntes (titulo, contenido, asignatura, archivo_uri, archivo_nombre, audio_uri) VALUES (?, ?, ?, ?, ?, ?)', 
        [titulo, contenido, asignatura, archivoAdjunto?.uri || null, archivoAdjunto?.nombre || null, audioUri]
      );
      resetearFormulario();
      cargarApuntes(); 
    } catch (error) { console.error('Error:', error); }
  };

  const actualizarApunte = () => {
    if (!titulo.trim() || !apunteActivo) return;
    try {
      db.runSync(
        'UPDATE apuntes SET titulo = ?, contenido = ?, asignatura = ?, archivo_uri = ?, archivo_nombre = ?, audio_uri = ? WHERE id = ?', 
        [titulo, contenido, asignatura, archivoAdjunto?.uri || null, archivoAdjunto?.nombre || null, audioUri, apunteActivo.id]
      );
      cargarApuntes();
      setModalVisible(false); // Cierra el modal al guardar
    } catch (error) { console.error('Error:', error); }
  };

  const eliminarApunte = (id: number) => {
    db.runSync('DELETE FROM apuntes WHERE id = ?', [id]);
    cargarApuntes();
    setModalVisible(false);
  };

  // --- INTERACCIÓN CON EL MODAL ---

  const abrirDetalles = (apunte: Apunte) => {
    setApunteActivo(apunte);
    setModoEdicion(false);
    // Precargamos los datos por si decide editar
    setTitulo(apunte.titulo);
    setContenido(apunte.contenido);
    setAsignatura(apunte.asignatura || 'Ninguna');
    setArchivoAdjunto(apunte.archivo_uri ? { uri: apunte.archivo_uri, nombre: apunte.archivo_nombre! } : null);
    setAudioUri(apunte.audio_uri || null);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    resetearFormulario();
  };

  // --- COMPONENTES VISUALES ---

  const ControlesHerramientas = () => (
    <View style={styles.herramientasContainer}>
      <TouchableOpacity style={styles.btnHerramienta} onPress={pegarDesdePortapapeles}>
        <Ionicons name="clipboard-outline" size={20} color="#0984E3" />
        <Text style={styles.textoHerramienta}>Pegar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.btnHerramienta} onPress={adjuntarTXT}>
        <Ionicons name="document-text-outline" size={20} color="#0984E3" />
        <Text style={styles.textoHerramienta}>+ TXT</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.btnHerramienta, grabando && styles.btnGrabando]} 
        onPress={grabando ? detenerGrabacion : iniciarGrabacion}
      >
        <Ionicons name={grabando ? "stop-circle" : "mic-outline"} size={20} color={grabando ? "#FFF" : "#D35400"} />
        <Text style={[styles.textoHerramienta, grabando && { color: '#FFF' }]}>
          {grabando ? "Detener" : "Grabar Voz"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const IndicadoresAdjuntos = () => (
    <View>
      {archivoAdjunto && (
        <View style={styles.badgeArchivo}>
          <Ionicons name="document-text" size={16} color="#2D3436" />
          <Text style={styles.badgeTexto} numberOfLines={1}>{archivoAdjunto.nombre}</Text>
          <TouchableOpacity onPress={() => setArchivoAdjunto(null)}><Ionicons name="close-circle" size={20} color="#FF7675" /></TouchableOpacity>
        </View>
      )}
      {audioUri && (
        <View style={styles.badgeArchivo}>
          <Ionicons name="mic" size={16} color="#2D3436" />
          <Text style={styles.badgeTexto} numberOfLines={1}>Nota de voz grabada</Text>
          <TouchableOpacity onPress={() => reproducirAudio(audioUri)} style={{marginRight: 10}}><Ionicons name="play-circle" size={24} color="#0984E3" /></TouchableOpacity>
          <TouchableOpacity onPress={() => setAudioUri(null)}><Ionicons name="close-circle" size={20} color="#FF7675" /></TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      
      {/* LISTA PRINCIPAL Y CREADOR */}
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

            <ControlesHerramientas />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Escribe o pega el contenido aquí..." placeholderTextColor="#B2BEC3" value={contenido} onChangeText={setContenido} multiline />
            <IndicadoresAdjuntos />

            <TouchableOpacity style={styles.botonGuardar} onPress={guardarApunte}>
              <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.textoBoton}>Guardar Apunte</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tarjetaApunte} onPress={() => abrirDetalles(item)} activeOpacity={0.7}>
            <View style={styles.cabeceraTarjeta}>
              <Text style={styles.tituloApunte}>{item.titulo}</Text>
              <TouchableOpacity onPress={() => eliminarApunte(item.id)}>
                <Ionicons name="trash-outline" size={22} color="#FF7675" />
              </TouchableOpacity>
            </View>
            <Text style={styles.contenidoApunte} numberOfLines={2}>{item.contenido}</Text>
            
            <View style={styles.pieTarjeta}>
              <View style={{flexDirection: 'row', gap: 5}}>
                {item.asignatura && item.asignatura !== "Ninguna" && (
                  <View style={styles.pillAsignatura}><Text style={styles.textoPill}>{item.asignatura}</Text></View>
                )}
                {item.audio_uri && <Ionicons name="mic" size={16} color="#0984E3" style={{marginTop: 3}} />}
                {item.archivo_uri && <Ionicons name="document-text" size={16} color="#0984E3" style={{marginTop: 3}} />}
              </View>
              <Text style={styles.fechaApunte}>{item.fecha_creacion}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* MODAL DE DETALLES Y EDICIÓN */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={cerrarModal}>
        <View style={styles.modalContainer}>
          
          {/* Cabecera del Modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={cerrarModal}><Ionicons name="close" size={28} color="#2D3436" /></TouchableOpacity>
            <Text style={styles.modalTitle}>{modoEdicion ? 'Editar Apunte' : 'Detalles'}</Text>
            <TouchableOpacity onPress={() => setModoEdicion(!modoEdicion)}>
              <Ionicons name={modoEdicion ? "eye-outline" : "pencil-outline"} size={24} color="#0984E3" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }}>
            {modoEdicion ? (
              // VISTA DE EDICIÓN
              <View>
                <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Título" />
                <View style={styles.pickerContainer}>
                  <Text style={styles.labelPicker}>Asignatura</Text>
                  <Picker selectedValue={asignatura} onValueChange={setAsignatura} style={styles.picker}>
                    {opcionesAsignaturas.map((opc, i) => <Picker.Item key={i} label={opc} value={opc} />)}
                  </Picker>
                </View>
                <ControlesHerramientas />
                <TextInput style={[styles.input, { height: 250, textAlignVertical: 'top' }]} value={contenido} onChangeText={setContenido} multiline />
                <IndicadoresAdjuntos />
                <TouchableOpacity style={styles.botonGuardar} onPress={actualizarApunte}>
                  <Text style={styles.textoBoton}>Actualizar Apunte</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // VISTA DE LECTURA
              <View>
                <Text style={styles.lecturaTitulo}>{apunteActivo?.titulo}</Text>
                
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
                  {apunteActivo?.asignatura && apunteActivo.asignatura !== "Ninguna" && (
                     <View style={styles.pillAsignatura}><Text style={styles.textoPill}>{apunteActivo.asignatura}</Text></View>
                  )}
                  <Text style={styles.fechaApunte}>{apunteActivo?.fecha_creacion}</Text>
                </View>

                {apunteActivo?.audio_uri && (
                  <TouchableOpacity style={styles.btnReproducir} onPress={() => reproducirAudio(apunteActivo.audio_uri!)}>
                    <Ionicons name="play" size={20} color="#FFF" />
                    <Text style={{color: '#FFF', fontWeight: 'bold', marginLeft: 8}}>Reproducir Clase Grabada</Text>
                  </TouchableOpacity>
                )}

                {apunteActivo?.archivo_uri && (
                  <View style={styles.badgeArchivo}>
                    <Ionicons name="document-text" size={20} color="#2D3436" />
                    <Text style={[styles.badgeTexto, {fontWeight: 'bold'}]}>Adjunto: {apunteActivo.archivo_nombre}</Text>
                  </View>
                )}

                <View style={styles.lecturaCuerpo}>
                  <Text style={styles.lecturaTexto}>{apunteActivo?.contenido}</Text>
                </View>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC', paddingHorizontal: 20 },
  formContainer: { marginTop: 40, marginBottom: 20, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15 },
  header: { fontSize: 28, fontWeight: '900', color: '#2D3436', marginBottom: 20 },
  
  input: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 15, color: '#2D3436' },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  pickerContainer: { backgroundColor: '#F8F9FA', borderRadius: 12, marginBottom: 12, paddingHorizontal: 12, paddingTop: 8 },
  labelPicker: { fontSize: 11, color: '#B2BEC3', fontWeight: 'bold', textTransform: 'uppercase' },
  picker: { height: 45, width: '100%', color: '#2D3436' },
  
  herramientasContainer: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btnHerramienta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1F0FF', paddingVertical: 10, borderRadius: 10 },
  textoHerramienta: { color: '#0984E3', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  btnGrabando: { backgroundColor: '#FF7675' },
  
  badgeArchivo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F2F6', padding: 12, borderRadius: 10, marginBottom: 12 },
  badgeTexto: { flex: 1, fontSize: 13, color: '#2D3436', marginHorizontal: 8 },

  botonGuardar: { flexDirection: 'row', backgroundColor: '#6C5CE7', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  textoBoton: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  tarjetaApunte: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, borderLeftWidth: 4, borderLeftColor: '#6C5CE7' },
  cabeceraTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tituloApunte: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', flex: 1, paddingRight: 10 },
  contenidoApunte: { fontSize: 15, color: '#636E72', marginBottom: 15, lineHeight: 22 },
  pieTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fechaApunte: { fontSize: 12, color: '#B2BEC3', fontWeight: '600' },
  pillAsignatura: { backgroundColor: '#E1F0FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  textoPill: { fontSize: 11, fontWeight: 'bold', color: '#0984E3' },

  // Estilos del Modal
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436' },
  
  lecturaTitulo: { fontSize: 26, fontWeight: '900', color: '#2D3436', marginBottom: 15, marginTop: 10 },
  lecturaCuerpo: { backgroundColor: '#F8F9FA', padding: 20, borderRadius: 16, minHeight: 300 },
  lecturaTexto: { fontSize: 16, color: '#2D3436', lineHeight: 26 },
  btnReproducir: { flexDirection: 'row', backgroundColor: '#6C5CE7', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }
});