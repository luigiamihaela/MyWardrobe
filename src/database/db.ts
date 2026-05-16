import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('wardrobe.db');

export const initDatabase = () => {
  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS clothes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_uri TEXT NOT NULL,
        category_id INTEGER,
        color TEXT,
        season TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );
    `);
    
    console.log('Baza de date și tabelele au fost inițializate cu succes!');
  } catch (error) {
    console.error('Eroare la inițializarea bazei de date: ', error);
  }
};

export default db;