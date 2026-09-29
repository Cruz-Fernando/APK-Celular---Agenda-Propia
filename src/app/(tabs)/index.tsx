import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import {
  useAudioRecorder,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import db from '../../../database/db'; 
import { useTheme } from '@/hooks/use-theme';
import PressableScale from '@/components/PressableScale';
import Reveal from '@/components/Reveal';
import ThemeToggle from '@/components/ThemeToggle';

interface Apunte {
  id: number;
  titulo: string;
  contenido: string;
  fecha_creacion: string;
  asignatura?: string;
  archivo_uri?: string;
  archivo_nombre?: string;
  audio_uri?: string;
  audio_nombre?: string;
}

// Extensiones de audio que se pueden adjuntar (AAC puro y AAC dentro de contenedor MP4,
// que es lo que generan la mayoría de grabadoras de celular).
const EXTENSIONES_AUDIO = ['aac', 'm4a'];

export default function ApuntesScreen() {
  const theme = useTheme();
  const styles = crearEstilos(theme);

  // Estados de la lista
  const [apuntes, setApuntes] = useState<Apunte[]>([]);

  // Estados del Formulario / Edición
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [asignatura, setAsignatura] = useState('Ninguna');
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ uri: string; nombre: string } | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioNombre, setAudioNombre] = useState<string | null>(null);

  // Estados para Audio (expo-audio)
  const [grabando, setGrabando] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(null);
  const estadoPlayer = useAudioPlayerStatus(player);
  const [uriCargada, setUriCargada] = useState<string | null>(null); // audio que tiene cargado el reproductor

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

  // Adjunta un audio .aac/.m4a. Lo copia al directorio de documentos (permanente)
  // porque el selector lo deja en caché, que Android puede borrar cuando quiera.
  const adjuntarAAC = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const extension = asset.name.split('.').pop()?.toLowerCase() ?? '';
      if (!EXTENSIONES_AUDIO.includes(extension)) {
        Alert.alert('Formato no compatible', 'Selecciona un archivo de audio .aac o .m4a');
        return;
      }

      const origen = new File(asset.uri);
      const destino = new File(Paths.document, `audio_${Date.now()}.${extension}`);
      await origen.copy(destino);

      pararAudio();
      setAudioUri(destino.uri);
      setAudioNombre(asset.name);
    } catch (err) {
      console.error('Error al adjuntar audio', err);
      Alert.alert('No se pudo adjuntar el audio', String(err));
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
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

      // recorder.uri apunta a la caché, que Android puede borrar en cualquier
      // momento. Copiamos el audio al directorio de documentos (permanente)
      // antes de guardar la ruta en la base de datos.
      const uriTemporal = recorder.uri;
      if (uriTemporal) {
        const archivoTemporal = new File(uriTemporal);
        const archivoPermanente = new File(Paths.document, `audio_${Date.now()}.m4a`);
        await archivoTemporal.copy(archivoPermanente);
        pararAudio();
        setAudioUri(archivoPermanente.uri);
        setAudioNombre(null); // null = nota de voz grabada en la app
      } else {
        setAudioUri(null);
        setAudioNombre(null);
      }
    } catch (err) {
      setGrabando(false);
      console.error('Error al detener la grabación', err);
    }
  };

  // --- REPRODUCCIÓN Y DESCARGA DE AUDIO ---

  const estaSonando = (uri?: string | null) => !!uri && uriCargada === uri && estadoPlayer.playing;

  const progresoDe = (uri?: string | null) =>
    uri && uriCargada === uri && estadoPlayer.duration > 0
      ? Math.min(estadoPlayer.currentTime / estadoPlayer.duration, 1)
      : 0;

  const pararAudio = () => {
    try { player.pause(); } catch (error) { /* el reproductor aún no tenía audio */ }
  };

  // Play / pausa sobre el mismo botón
  const alternarReproduccion = async (uri: string) => {
    try {
      if (uriCargada === uri && estadoPlayer.playing) {
        player.pause();
        return;
      }
      if (uriCargada !== uri) {
        player.replace({ uri });
        setUriCargada(uri);
      } else if (estadoPlayer.duration > 0 && estadoPlayer.currentTime >= estadoPlayer.duration - 0.1) {
        // Ya terminó: volvemos al inicio para poder repetirlo
        await player.seekTo(0);
      }
      player.play();
    } catch (error) {
      console.error('Error al reproducir', error);
      Alert.alert('No se pudo reproducir el audio', 'Es posible que el archivo ya no exista.');
    }
  };

  // "Descargar": copia el audio a una carpeta que elige el usuario (Descargas, Documentos, etc.)
  const descargarAudio = async (uri: string, nombreOriginal?: string | null) => {
    try {
      const origen = new File(uri);
      if (!origen.exists) {
        Alert.alert('Archivo no encontrado', 'El audio ya no existe en el dispositivo.');
        return;
      }

      const carpeta = await Directory.pickDirectoryAsync();
      const nombre = nombreOriginal || origen.name;
      const mime = nombre.toLowerCase().endsWith('.aac') ? 'audio/aac' : 'audio/mp4';

      const copia = carpeta.createFile(nombre, mime);
      await copia.write(await origen.bytes());

      Alert.alert('Audio descargado', `Se guardó como "${nombre}"`);
    } catch (err) {
      // Si el usuario cierra el selector de carpetas, no es un error real
      if (/cancel/i.test(String(err))) return;
      console.error('Error al descargar', err);
      Alert.alert('No se pudo descargar el audio', String(err));
    }
  };

  // --- FUNCIONES DE BASE DE DATOS ---

  const resetearFormulario = () => {
    setTitulo(''); setContenido(''); setAsignatura('Ninguna');
    setArchivoAdjunto(null); setAudioUri(null); setAudioNombre(null);
  };

  const guardarApunte = () => {
    if (!titulo.trim()) return;
    try {
      db.runSync(
        'INSERT INTO apuntes (titulo, contenido, asignatura, archivo_uri, archivo_nombre, audio_uri, audio_nombre) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [titulo, contenido, asignatura, archivoAdjunto?.uri || null, archivoAdjunto?.nombre || null, audioUri, audioNombre]
      );
      pararAudio();
      resetearFormulario();
      cargarApuntes();
    } catch (error) { console.error('Error:', error); }
  };

  const actualizarApunte = () => {
    if (!titulo.trim() || !apunteActivo) return;
    try {
      db.runSync(
        'UPDATE apuntes SET titulo = ?, contenido = ?, asignatura = ?, archivo_uri = ?, archivo_nombre = ?, audio_uri = ?, audio_nombre = ? WHERE id = ?',
        [titulo, contenido, asignatura, archivoAdjunto?.uri || null, archivoAdjunto?.nombre || null, audioUri, audioNombre, apunteActivo.id]
      );

      // Si el audio anterior fue reemplazado o quitado, borramos su copia para no dejar basura
      if (apunteActivo.audio_uri && apunteActivo.audio_uri !== audioUri) {
        try { new File(apunteActivo.audio_uri).delete(); } catch (error) { /* ya no existía */ }
      }

      pararAudio();
      cargarApuntes();
      setModalVisible(false); // Cierra el modal al guardar
    } catch (error) { console.error('Error:', error); }
  };

  const eliminarApunte = (id: number, uriAudio?: string) => {
    pararAudio();
    db.runSync('DELETE FROM apuntes WHERE id = ?', [id]);
    if (uriAudio) {
      try { new File(uriAudio).delete(); } catch (error) { /* el archivo ya no existía */ }
    }
    cargarApuntes();
    setModalVisible(false);
  };

  // --- INTERACCIÓN CON EL MODAL ---

  const abrirDetalles = (apunte: Apunte) => {
    pararAudio();
    setApunteActivo(apunte);
    setModoEdicion(false);
    // Precargamos los datos por si decide editar
    setTitulo(apunte.titulo);
    setContenido(apunte.contenido);
    setAsignatura(apunte.asignatura || 'Ninguna');
    setArchivoAdjunto(apunte.archivo_uri ? { uri: apunte.archivo_uri, nombre: apunte.archivo_nombre! } : null);
    setAudioUri(apunte.audio_uri || null);
    setAudioNombre(apunte.audio_nombre || null);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    pararAudio();
    setModalVisible(false);
    resetearFormulario();
  };

  // --- COMPONENTES VISUALES ---
  // Son funciones que se llaman como {ControlesHerramientas()} (no como <Componente />)
  // para que React no los desmonte en cada actualización del reproductor.

  const ControlesHerramientas = () => (
    <View style={styles.herramientasContainer}>
      <PressableScale style={styles.btnHerramienta} onPress={pegarDesdePortapapeles}>
        <Ionicons name="clipboard-outline" size={20} color="#0984E3" />
        <Text style={styles.textoHerramienta}>Pegar</Text>
      </PressableScale>

      <PressableScale style={styles.btnHerramienta} onPress={adjuntarTXT}>
        <Ionicons name="document-text-outline" size={20} color="#0984E3" />
        <Text style={styles.textoHerramienta}>+ TXT</Text>
      </PressableScale>

      <PressableScale style={styles.btnHerramienta} onPress={adjuntarAAC}>
        <Ionicons name="musical-notes-outline" size={20} color="#0984E3" />
        <Text style={styles.textoHerramienta}>+ AAC</Text>
      </PressableScale>

      <PressableScale
        style={[styles.btnHerramienta, grabando && styles.btnGrabando]}
        onPress={grabando ? detenerGrabacion : iniciarGrabacion}
      >
        <Ionicons name={grabando ? "stop-circle" : "mic-outline"} size={20} color={grabando ? "#FFF" : "#D35400"} />
        <Text style={[styles.textoHerramienta, grabando && { color: '#FFF' }]}>
          {grabando ? "Detener" : "Grabar Voz"}
        </Text>
      </PressableScale>
    </View>
  );

  const IndicadoresAdjuntos = () => (
    <View>
      {archivoAdjunto && (
        <View style={styles.badgeArchivo}>
          <Ionicons name="document-text" size={16} color={theme.text} />
          <Text style={styles.badgeTexto} numberOfLines={1}>{archivoAdjunto.nombre}</Text>
          <TouchableOpacity onPress={() => setArchivoAdjunto(null)}><Ionicons name="close-circle" size={20} color="#FF7675" /></TouchableOpacity>
        </View>
      )}
      {audioUri && (
        <View style={styles.badgeArchivo}>
          <Ionicons name={audioNombre ? 'musical-notes' : 'mic'} size={16} color={theme.text} />
          <Text style={styles.badgeTexto} numberOfLines={1}>{audioNombre || 'Nota de voz grabada'}</Text>
          <TouchableOpacity onPress={() => alternarReproduccion(audioUri)} style={{ marginRight: 10 }}>
            <Ionicons name={estaSonando(audioUri) ? 'pause-circle' : 'play-circle'} size={26} color="#0984E3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => descargarAudio(audioUri, audioNombre)} style={{ marginRight: 10 }}>
            <Ionicons name="download-outline" size={22} color="#0984E3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { pararAudio(); setAudioUri(null); setAudioNombre(null); }}>
            <Ionicons name="close-circle" size={20} color="#FF7675" />
          </TouchableOpacity>
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
          <Reveal style={styles.formContainer}>
            <View style={styles.headerFila}>
              <Text style={[styles.header, { marginBottom: 0 }]}>Mis Apuntes</Text>
              <ThemeToggle />
            </View>

            <TextInput style={styles.input} placeholder="Título del apunte..." placeholderTextColor={theme.textSecondary} value={titulo} onChangeText={setTitulo} />

            <View style={styles.pickerContainer}>
              <Text style={styles.labelPicker}>Asignatura</Text>
              <Picker selectedValue={asignatura} onValueChange={setAsignatura} style={styles.picker} dropdownIconColor={theme.text}>
                {opcionesAsignaturas.map((opc, i) => <Picker.Item key={i} label={opc} value={opc} color={theme.text} />)}
              </Picker>
            </View>

            {ControlesHerramientas()}
            <TextInput style={[styles.input, styles.textArea]} placeholder="Escribe o pega el contenido aquí..." placeholderTextColor={theme.textSecondary} value={contenido} onChangeText={setContenido} multiline />
            {IndicadoresAdjuntos()}

            <PressableScale style={styles.botonGuardar} onPress={guardarApunte}>
              <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.textoBoton}>Guardar Apunte</Text>
            </PressableScale>
          </Reveal>
        }
        renderItem={({ item, index }) => (
          // Aparición escalonada: cada tarjeta entra 60ms después de la anterior (máx. 8)
          <Reveal delay={Math.min(index, 8) * 60}>
            <PressableScale style={styles.tarjetaApunte} onPress={() => abrirDetalles(item)} scaleTo={0.97}>
              <View style={styles.cabeceraTarjeta}>
                <Text style={styles.tituloApunte}>{item.titulo}</Text>
                <TouchableOpacity onPress={() => eliminarApunte(item.id, item.audio_uri)}>
                  <Ionicons name="trash-outline" size={22} color="#FF7675" />
                </TouchableOpacity>
              </View>

              <Text style={styles.contenidoApunte} numberOfLines={2}>{item.contenido}</Text>

              <View style={styles.pieTarjeta}>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  {item.asignatura && item.asignatura !== "Ninguna" && (
                    <View style={styles.pillAsignatura}><Text style={styles.textoPill}>{item.asignatura}</Text></View>
                  )}
                  {item.audio_uri && <Ionicons name={item.audio_nombre ? 'musical-notes' : 'mic'} size={16} color="#0984E3" style={{ marginTop: 3 }} />}
                  {item.archivo_uri && <Ionicons name="document-text" size={16} color="#0984E3" style={{ marginTop: 3 }} />}
                </View>
                <Text style={styles.fechaApunte}>{item.fecha_creacion}</Text>
              </View>
            </PressableScale>
          </Reveal>
        )}
      />

      {/* MODAL DE DETALLES Y EDICIÓN */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={cerrarModal}>
        <View style={styles.modalContainer}>

          {/* Cabecera del Modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={cerrarModal}><Ionicons name="close" size={28} color={theme.text} /></TouchableOpacity>
            <Text style={styles.modalTitle}>{modoEdicion ? 'Editar Apunte' : 'Detalles'}</Text>
            <TouchableOpacity onPress={() => setModoEdicion(!modoEdicion)}>
              <Ionicons name={modoEdicion ? "eye-outline" : "pencil-outline"} size={24} color="#0984E3" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }}>
            {modoEdicion ? (
              // VISTA DE EDICIÓN
              <View>
                <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Título" placeholderTextColor={theme.textSecondary} />
                <View style={styles.pickerContainer}>
                  <Text style={styles.labelPicker}>Asignatura</Text>
                  <Picker selectedValue={asignatura} onValueChange={setAsignatura} style={styles.picker} dropdownIconColor={theme.text}>
                    {opcionesAsignaturas.map((opc, i) => <Picker.Item key={i} label={opc} value={opc} color={theme.text} />)}
                  </Picker>
                </View>
                {ControlesHerramientas()}
                <TextInput style={[styles.input, { height: 250, textAlignVertical: 'top' }]} value={contenido} onChangeText={setContenido} multiline placeholderTextColor={theme.textSecondary} />
                {IndicadoresAdjuntos()}
                <PressableScale style={styles.botonGuardar} onPress={actualizarApunte}>
                  <Text style={styles.textoBoton}>Actualizar Apunte</Text>
                </PressableScale>
              </View>
            ) : (
              // VISTA DE LECTURA
              <View>
                <Text style={styles.lecturaTitulo}>{apunteActivo?.titulo}</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  {apunteActivo?.asignatura && apunteActivo.asignatura !== "Ninguna" && (
                    <View style={styles.pillAsignatura}><Text style={styles.textoPill}>{apunteActivo.asignatura}</Text></View>
                  )}
                  <Text style={styles.fechaApunte}>{apunteActivo?.fecha_creacion}</Text>
                </View>

                {apunteActivo?.audio_uri && (
                  <View style={styles.tarjetaAudio}>
                    <PressableScale style={styles.btnPlayGrande} onPress={() => alternarReproduccion(apunteActivo.audio_uri!)}>
                      <Ionicons name={estaSonando(apunteActivo.audio_uri) ? 'pause' : 'play'} size={22} color="#FFF" />
                    </PressableScale>

                    <View style={{ flex: 1, marginHorizontal: 14 }}>
                      <Text style={styles.audioNombre} numberOfLines={1}>
                        {apunteActivo.audio_nombre || 'Nota de voz grabada'}
                      </Text>
                      <View style={styles.barraFondo}>
                        <View style={[styles.barraProgreso, { width: `${Math.round(progresoDe(apunteActivo.audio_uri) * 100)}%` as `${number}%` }]} />
                      </View>
                    </View>

                    <PressableScale style={styles.btnIcono} onPress={() => descargarAudio(apunteActivo.audio_uri!, apunteActivo.audio_nombre)}>
                      <Ionicons name="download-outline" size={22} color="#0984E3" />
                    </PressableScale>
                  </View>
                )}

                {apunteActivo?.archivo_uri && (
                  <View style={styles.badgeArchivo}>
                    <Ionicons name="document-text" size={20} color={theme.text} />
                    <Text style={[styles.badgeTexto, { fontWeight: 'bold' }]}>Adjunto: {apunteActivo.archivo_nombre}</Text>
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

const crearEstilos = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20 },
  formContainer: { marginTop: 40, marginBottom: 20, backgroundColor: theme.backgroundElement, padding: 20, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15 },
  headerFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 28, fontWeight: '900', color: theme.text, marginBottom: 20 },

  input: { backgroundColor: theme.background, padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 15, color: theme.text },
  textArea: { height: 100, textAlignVertical: 'top' },

  pickerContainer: { backgroundColor: theme.background, borderRadius: 12, marginBottom: 12, paddingHorizontal: 12, paddingTop: 8 },
  labelPicker: { fontSize: 11, color: theme.textSecondary, fontWeight: 'bold', textTransform: 'uppercase' },
  picker: { height: 45, width: '100%', color: theme.text },

  // 4 botones en cuadrícula de 2x2
  herramientasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  btnHerramienta: { flexGrow: 1, flexBasis: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.backgroundSelected, paddingVertical: 10, borderRadius: 10 },
  textoHerramienta: { color: '#0984E3', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  btnGrabando: { backgroundColor: '#FF7675' },

  badgeArchivo: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundSelected, padding: 12, borderRadius: 10, marginBottom: 12 },
  badgeTexto: { flex: 1, fontSize: 13, color: theme.text, marginHorizontal: 8 },

  botonGuardar: { flexDirection: 'row', backgroundColor: '#6C5CE7', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  textoBoton: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  tarjetaApunte: { backgroundColor: theme.backgroundElement, padding: 20, borderRadius: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, borderLeftWidth: 4, borderLeftColor: '#6C5CE7' },
  cabeceraTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tituloApunte: { fontSize: 18, fontWeight: 'bold', color: theme.text, flex: 1, paddingRight: 10 },
  contenidoApunte: { fontSize: 15, color: theme.textSecondary, marginBottom: 15, lineHeight: 22 },
  pieTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fechaApunte: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
  pillAsignatura: { backgroundColor: theme.backgroundSelected, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  textoPill: { fontSize: 11, fontWeight: 'bold', color: '#0984E3' },

  // Estilos del Modal
  modalContainer: { flex: 1, backgroundColor: theme.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: theme.backgroundElement, borderBottomWidth: 1, borderBottomColor: theme.backgroundSelected },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },

  lecturaTitulo: { fontSize: 26, fontWeight: '900', color: theme.text, marginBottom: 15, marginTop: 10 },
  lecturaCuerpo: { backgroundColor: theme.backgroundElement, padding: 20, borderRadius: 16, minHeight: 300 },
  lecturaTexto: { fontSize: 16, color: theme.text, lineHeight: 26 },

  // Reproductor de audio (vista de lectura)
  tarjetaAudio: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundElement, padding: 14, borderRadius: 16, marginBottom: 15 },
  btnPlayGrande: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center' },
  audioNombre: { fontSize: 14, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  barraFondo: { height: 5, borderRadius: 3, backgroundColor: theme.backgroundSelected, overflow: 'hidden' },
  barraProgreso: { height: 5, borderRadius: 3, backgroundColor: '#6C5CE7' },
  btnIcono: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
});
