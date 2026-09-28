import * as SQLite from 'expo-sqlite';

// Abre o crea la base de datos local
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
    console.log('✅ Base de datos y tablas inicializadas correctamente.');
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
  }
};

export default db;