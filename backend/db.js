import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new sqlite3.Database(path.join(__dirname, 'craffo.db'));

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initTables() {
  await run(`PRAGMA foreign_keys = ON;`);

  await run(`
    CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL CHECK(platform IN ('Salla', 'Zid')),
      external_id TEXT,
      name TEXT NOT NULL,
      image TEXT,
      description TEXT,
      price TEXT,
      demo_url TEXT,
      purchase_url TEXT,
      plan TEXT DEFAULT NULL,   -- أصبح يقبل NULL (بدون باقة)
      order_index INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      is_modified INTEGER DEFAULT 0,
      original_api_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(platform, name)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS store_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme_id INTEGER NOT NULL,
      store_name TEXT NOT NULL,
      store_url TEXT NOT NULL,
      platform TEXT NOT NULL,
      plan TEXT DEFAULT NULL,
      image TEXT,
      is_approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
    )
  `);

  await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_store_url ON store_links (store_url)`);

  await run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);
}

async function createDefaultAdmin() {
  const existing = await get('SELECT id FROM admin_users WHERE username = ?', [config.adminUsername]);
  if (!existing) {
    const hash = bcrypt.hashSync(config.adminPassword, 10);
    await run('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)', [config.adminUsername, hash]);
    console.log(' Admin user created');
  }
}

await initTables();
await createDefaultAdmin();
console.log(' SQLite database ready (themes.plan accepts NULL)');

export { db };