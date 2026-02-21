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
  {
    version: 5,
    // 0.6.1 — user-created recipes
    statements: [
      `CREATE TABLE IF NOT EXISTS recipes (
        id          TEXT    PRIMARY KEY NOT NULL,
        name        TEXT    NOT NULL,
        emoji       TEXT    NOT NULL DEFAULT '🍴',
        prep_min    INTEGER NOT NULL DEFAULT 0,
        cook_min    INTEGER NOT NULL DEFAULT 0,
        tags        TEXT    NOT NULL DEFAULT '',
        ingredients TEXT    NOT NULL DEFAULT '[]',
        steps       TEXT    NOT NULL DEFAULT '[]',
        created_at  TEXT    NOT NULL
      );`,
    ],
  },
  {
    version: 6,
    // 0.7.0 — cooking planner (weekly meal plan)
    statements: [
      `CREATE TABLE IF NOT EXISTS meal_plan (
        id           TEXT    PRIMARY KEY NOT NULL,
        date         TEXT    NOT NULL,
        slot         TEXT    NOT NULL,
        recipe_id    TEXT    NOT NULL,
        recipe_name  TEXT    NOT NULL,
        recipe_emoji TEXT    NOT NULL DEFAULT '🍴',
        ingredients  TEXT    NOT NULL DEFAULT '[]',
        created_at   TEXT    NOT NULL,
        UNIQUE(date, slot)
      );`,
    ],
  },
  {
    version: 7,
    // 0.9.0 — progress photos
    statements: [
      `CREATE TABLE IF NOT EXISTS progress_photos (
        id         TEXT    PRIMARY KEY NOT NULL,
        date       TEXT    NOT NULL,
        photo_uri  TEXT    NOT NULL,
        created_at TEXT    NOT NULL
      );`,
    ],
  },
];
