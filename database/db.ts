import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('productividad.db');

export const initDatabase = () => {
  try {
    db.execSync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS apuntes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        contenido TEXT,
        fecha_creacion TEXT DEFAULT (datetime('now', 'localtime')),
        etiquetas TEXT
      );

      CREATE TABLE IF NOT EXISTS habitos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        frecuencia TEXT,
        racha_actual INTEGER DEFAULT 0,
        mejor_racha INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS registros_habitos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habito_id INTEGER,
        fecha TEXT,
        completado INTEGER DEFAULT 0,
        FOREIGN KEY (habito_id) REFERENCES habitos (id)
      );

      CREATE TABLE IF NOT EXISTS agenda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo_tarea TEXT NOT NULL,
        fecha_limite TEXT,
        estado TEXT DEFAULT 'pendiente'
      );
    `);

    // Migraciones seguras para Agenda
    try { db.execSync('ALTER TABLE agenda ADD COLUMN descripcion TEXT;'); } catch (e) {}
    try { db.execSync('ALTER TABLE agenda ADD COLUMN asignatura TEXT;'); } catch (e) {}
    try { db.execSync('ALTER TABLE agenda ADD COLUMN etiqueta_personal TEXT;'); } catch (e) {}
    try { db.execSync('ALTER TABLE agenda ADD COLUMN archivo_uri TEXT;'); } catch (e) {}
    try { db.execSync('ALTER TABLE agenda ADD COLUMN archivo_nombre TEXT;'); } catch (e) {}

    // Migraciones seguras para Apuntes (NUEVO)
    try { db.execSync('ALTER TABLE apuntes ADD COLUMN asignatura TEXT;'); } catch (e) {}
    try { db.execSync('ALTER TABLE apuntes ADD COLUMN archivo_uri TEXT;'); } catch (e) {}
    try { db.execSync('ALTER TABLE apuntes ADD COLUMN archivo_nombre TEXT;'); } catch (e) {}
    try { db.execSync('ALTER TABLE apuntes ADD COLUMN audio_uri TEXT;'); } catch (e) {}

    console.log('✅ Base de datos inicializada y actualizada correctamente.');
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
  }
};

export default db;