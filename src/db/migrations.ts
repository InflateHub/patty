/**
 * All SQL migrations in order.
 * Each entry is a { version, statements[] } pair.
 * Add new migrations below existing ones — never modify old ones.
 */
export interface Migration {
  version: number;
  statements: string[];
}

export const migrations: Migration[] = [
  {
    version: 1,
    // 0.2.0 — weight tracking
    statements: [
      `CREATE TABLE IF NOT EXISTS weight_entries (
        id        TEXT    PRIMARY KEY NOT NULL,
        date      TEXT    NOT NULL,
        value     REAL    NOT NULL,
        unit      TEXT    NOT NULL DEFAULT 'kg',
        note      TEXT
      );`,
    ],
  },
  {
    version: 2,
    // 0.3.0 — water intake
    statements: [
      `CREATE TABLE IF NOT EXISTS water_entries (
        id         TEXT    PRIMARY KEY NOT NULL,
        date       TEXT    NOT NULL,
        amount_ml  INTEGER NOT NULL,
        created_at TEXT    NOT NULL
      );`,
    ],
  },
  {
    version: 3,
    // 0.4.0 — sleep tracking
    statements: [
      `CREATE TABLE IF NOT EXISTS sleep_entries (
        id           TEXT     PRIMARY KEY NOT NULL,
        date         TEXT     NOT NULL,
        bedtime      TEXT     NOT NULL,
        waketime     TEXT     NOT NULL,
        duration_min INTEGER  NOT NULL,
        quality      INTEGER  NOT NULL,
        note         TEXT
      );`,
    ],
  },
  {
    version: 4,
    // 0.5.0 — food log
    statements: [
      `CREATE TABLE IF NOT EXISTS food_entries (
        id         TEXT    PRIMARY KEY NOT NULL,
        date       TEXT    NOT NULL,
        meal       TEXT    NOT NULL,
        photo_uri  TEXT,
        note       TEXT,
        created_at TEXT    NOT NULL
      );`,
    ],
  },
];
