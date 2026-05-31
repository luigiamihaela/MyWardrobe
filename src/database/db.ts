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

      CREATE TABLE IF NOT EXISTS outfit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        outfit_id INTEGER NOT NULL,
        FOREIGN KEY (outfit_id) REFERENCES outfits (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT DEFAULT 'Stylist'
      );
    `);
    const rowCount = db.getFirstSync<{ total: number }>('SELECT COUNT(id) as total FROM user_profile');
      if (rowCount && rowCount.total === 0) {
      db.runSync("INSERT INTO user_profile (username) VALUES ('Stylist')");
    }
    
    console.log('The database and tables have been successfully initialized!');
  } catch (error) {
    console.error('Error initializing the database: ', error);
  }
};

export default db;