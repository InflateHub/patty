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
  // 0.3.0 — water intake  (add here)
  // 0.4.0 — sleep entries (add here)
  // 0.5.0 — food log      (add here)
];
