import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('mywardrobe_v1.db');

export const initDatabase = () => {
  try {
    db.execSync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS clothes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_uri TEXT NOT NULL,
        category_id INTEGER,
        color TEXT,
        season TEXT
      );

      CREATE TABLE IF NOT EXISTS outfits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, 
        dress_id INTEGER,
        top_id INTEGER,
        bottom_id INTEGER,
        shoes_id INTEGER,
        outerwear_id INTEGER,
        hat_id INTEGER,
        purse_id INTEGER,

        FOREIGN KEY (dress_id) REFERENCES clothes (id) ON DELETE SET NULL,
        FOREIGN KEY (top_id) REFERENCES clothes (id) ON DELETE SET NULL,
        FOREIGN KEY (bottom_id) REFERENCES clothes (id) ON DELETE SET NULL,
        FOREIGN KEY (shoes_id) REFERENCES clothes (id) ON DELETE SET NULL,
        FOREIGN KEY (outerwear_id) REFERENCES clothes (id) ON DELETE SET NULL,
        FOREIGN KEY (hat_id) REFERENCES clothes (id) ON DELETE SET NULL,
        FOREIGN KEY (purse_id) REFERENCES clothes (id) ON DELETE SET NULL
      );
    `);
    
    console.log('The database and tables have been successfully initialized!');
  } catch (error) {
    console.error('Error initializing the database: ', error);
  }
};

export default db;