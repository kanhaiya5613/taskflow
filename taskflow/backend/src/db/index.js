import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Allow overriding the DB file (used by tests to get an isolated database).
const DB_PATH = process.env.TASKFLOW_DB_PATH || path.join(__dirname, '..', '..', 'taskflow.db');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

export function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

initSchema();

export default db;
