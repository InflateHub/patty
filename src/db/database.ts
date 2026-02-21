import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { migrations } from './migrations';

const DB_NAME = 'patty';
const sqlite = new SQLiteConnection(CapacitorSQLite);

let _db: SQLiteDBConnection | null = null;

/**
 * Initialise the SQLite database.
 * Must be awaited once at app startup (in main.tsx) before any hooks run.
 */
export async function initDatabase(): Promise<void> {
  const platform = Capacitor.getPlatform();

  // Web: wait for jeep-sqlite custom element to be ready
  if (platform === 'web') {
    await customElements.whenDefined('jeep-sqlite');
    await sqlite.initWebStore();
  }

  const db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  await db.open();
  await runMigrations(db);
  _db = db;
}

/**
 * Returns the open DB connection.
 * Throws if initDatabase() has not been called yet.
 */
export function getDb(): SQLiteDBConnection {
  if (!_db) throw new Error('Database not initialised. Call initDatabase() first.');
  return _db;
}

async function runMigrations(db: SQLiteDBConnection): Promise<void> {
  // Ensure schema_version table exists
  await db.run(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY NOT NULL
    );
  `);

  const result = await db.query('SELECT MAX(version) AS v FROM schema_version;');
  const currentVersion: number = result.values?.[0]?.v ?? 0;

  const pending = migrations.filter((m) => m.version > currentVersion);
  for (const migration of pending) {
    for (const statement of migration.statements) {
      await db.run(statement);
    }
    await db.run('INSERT INTO schema_version (version) VALUES (?);', [migration.version]);
  }
}
