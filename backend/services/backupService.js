import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../craffo.db');
const backupDir = path.join(__dirname, '../backups');

export function backupDatabase() {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `craffo-backup-${timestamp}.db`);
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Backup created: ${backupPath}`);
  return { success: true, path: backupPath };
}