import * as SQLite from 'expo-sqlite';

// 1. CONEXIÓN A LA BASE DE DATOS
// Abre la base de datos 'productividad.db'. Si el archivo no existe en el celular, lo crea automáticamente.
// Usamos la versión 'Sync' (síncrona) que es más rápida y moderna en Expo SDK 57.
const db = SQLite.openDatabaseSync('productividad.db');

export const initDatabase = () => {
  try {
    // 2. CREACIÓN DE TABLAS BASE
    // 'execSync' ejecuta múltiples comandos SQL de una sola vez.
    // 'IF NOT EXISTS' es crucial: le dice a SQLite que solo cree la tabla si es la primera vez que se abre la app.
    db.execSync(`
      -- Activa el soporte para llaves foráneas (necesario para conectar los hábitos con sus registros)
      PRAGMA foreign_keys = ON;

      -- TABLA 1: APUNTES (Fase 1 completada)
      CREATE TABLE IF NOT EXISTS apuntes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        contenido TEXT,
        fecha_creacion TEXT DEFAULT (datetime('now', 'localtime')),
        etiquetas TEXT
      );

      -- TABLA 2: HÁBITOS (Preparación para la Fase 4)
      CREATE TABLE IF NOT EXISTS habitos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        frecuencia TEXT,
        racha_actual INTEGER DEFAULT 0,
        mejor_racha INTEGER DEFAULT 0
      );

      -- TABLA 3: REGISTROS DE HÁBITOS (Preparación para la Fase 4)
      -- Esta tabla guarda el historial. 'habito_id' se conecta con el 'id' de la tabla habitos.
      CREATE TABLE IF NOT EXISTS registros_habitos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habito_id INTEGER,
        fecha TEXT,
        completado INTEGER DEFAULT 0,
        FOREIGN KEY (habito_id) REFERENCES habitos (id)
      );

      -- TABLA 4: AGENDA (Fase 3 actual - Estructura original)
      CREATE TABLE IF NOT EXISTS agenda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo_tarea TEXT NOT NULL,
        fecha_limite TEXT,
        estado TEXT DEFAULT 'pendiente'
      );
    `);

    // 3. ACTUALIZACIÓN DEL ESQUEMA (Migraciones de base de datos)
    // Como ya tenías la tabla 'agenda' creada de antes, necesitamos inyectarle las nuevas 
    // columnas para las asignaturas, descripciones y archivos sin borrar tus tareas actuales.
    // Separamos cada ALTER TABLE en su propio bloque try-catch. Si la columna ya se añadió
    // en una ejecución anterior, SQLite arrojará un error que atraparemos y silenciaremos (catch vacío).
    
    try { 
      db.execSync('ALTER TABLE agenda ADD COLUMN descripcion TEXT;'); 
    } catch (e) { /* Si la columna existe, no hacemos nada */ }
    
    try { 
      db.execSync('ALTER TABLE agenda ADD COLUMN asignatura TEXT;'); 
    } catch (e) { /* Si la columna existe, no hacemos nada */ }
    
    try { 
      db.execSync('ALTER TABLE agenda ADD COLUMN etiqueta_personal TEXT;'); 
    } catch (e) { /* Si la columna existe, no hacemos nada */ }
    
    try { 
      db.execSync('ALTER TABLE agenda ADD COLUMN archivo_uri TEXT;'); 
    } catch (e) { /* Guarda la ruta interna del celular donde está el archivo */ }
    
    try { 
      db.execSync('ALTER TABLE agenda ADD COLUMN archivo_nombre TEXT;'); 
    } catch (e) { /* Guarda el nombre visible del archivo (ej. "Tesis.pdf") */ }
    
    // NUEVA LÍNEA PARA APUNTES:
    try { db.execSync('ALTER TABLE apuntes ADD COLUMN asignatura TEXT;'); } catch (e) {}

    // Mensaje de éxito en la terminal
    console.log('✅ Base de datos y tablas inicializadas (y actualizadas) correctamente.');
  } catch (error) {
    // Si ocurre un error grave (ej. falta de permisos en el celular), lo mostramos aquí
    console.error('❌ Error inicializando la base de datos:', error);
  }
};

// 4. EXPORTACIÓN
// Exportamos la constante 'db' para que otros archivos (como index.tsx o agenda.tsx) 
// puedan importarla y usarla para hacer SELECT, INSERT, UPDATE, o DELETE.
export default db;