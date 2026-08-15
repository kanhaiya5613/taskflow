// Points the app at a throwaway SQLite file so tests never touch taskflow.db.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = path.join(__dirname, 'test.db');

// Must be set before any module imports src/db/index.js.
if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
process.env.TASKFLOW_DB_PATH = TEST_DB_PATH;

export { TEST_DB_PATH };
