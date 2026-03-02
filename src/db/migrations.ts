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
  {
    version: 8,
    // 0.9.3 — user profile + app settings (key-value store)
    statements: [
      `CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );`,
    ],
  },
  {
    version: 9,
    // 0.9.4 — calorie fields on food log + recipes
    statements: [
      `ALTER TABLE food_entries ADD COLUMN kcal INTEGER;`,
      `ALTER TABLE recipes ADD COLUMN kcal_per_serving INTEGER;`,
    ],
  },
  {
    version: 10,
    // 1.0.5 — move photo storage from SQLite TEXT blobs to app filesystem
    //         progress_photos: drop + recreate with photo_path (pre-production data wipe)
    //         food_entries:    add photo_path column (new entries use FS; old rows keep null photo_uri)
    statements: [
      `DROP TABLE IF EXISTS progress_photos;`,
      `CREATE TABLE IF NOT EXISTS progress_photos (
        id         TEXT    PRIMARY KEY NOT NULL,
        date       TEXT    NOT NULL,
        photo_path TEXT    NOT NULL,
        created_at TEXT    NOT NULL
      );`,
      `ALTER TABLE food_entries ADD COLUMN photo_path TEXT;`,
    ],
  },
  {
    version: 11,
    // 1.1.0 — allow deletion of seed recipes
    statements: [
      `CREATE TABLE IF NOT EXISTS deleted_seed_recipes (
        id TEXT PRIMARY KEY NOT NULL
      );`,
    ],
  },
  {
    version: 12,
    // 1.4.0 — mandatory progress photo on weight entries
    statements: [
      `ALTER TABLE weight_entries ADD COLUMN photo_path TEXT;`,
    ],
  },
  {
    version: 13,
    // 1.5.0 — add created_at to weight_entries for correct time-based ordering
    statements: [
      `ALTER TABLE weight_entries ADD COLUMN created_at TEXT;`,
    ],
  },
  {
    version: 14,
    // 2.3.0 — workout tracking
    statements: [
      `CREATE TABLE IF NOT EXISTS workout_entries (
        id             TEXT    PRIMARY KEY NOT NULL,
        date           TEXT    NOT NULL,
        workout_type   TEXT    NOT NULL,
        name           TEXT    NOT NULL,
        duration_sec   INTEGER NOT NULL DEFAULT 0,
        steps          INTEGER,
        intensity      INTEGER,
        calories_burnt INTEGER,
        notes          TEXT,
        created_at     TEXT    NOT NULL
      );`,
    ],
  },
  {
    version: 15,
    // 2.5.0 — habits tracking (good & bad habit types)
    statements: [
      `CREATE TABLE IF NOT EXISTS habit_definitions (
        id         TEXT    PRIMARY KEY NOT NULL,
        name       TEXT    NOT NULL,
        emoji      TEXT    NOT NULL DEFAULT '✅',
        colour     TEXT    NOT NULL DEFAULT '#5C7A6E',
        type       TEXT    NOT NULL DEFAULT 'good',
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS habit_completions (
        id         TEXT    PRIMARY KEY NOT NULL,
        habit_id   TEXT    NOT NULL,
        date       TEXT    NOT NULL,
        created_at TEXT    NOT NULL,
        UNIQUE(habit_id, date)
      );`,
      `CREATE TABLE IF NOT EXISTS habit_relapses (
        id         TEXT    PRIMARY KEY NOT NULL,
        habit_id   TEXT    NOT NULL,
        date       TEXT    NOT NULL,
        created_at TEXT    NOT NULL,
        UNIQUE(habit_id, date)
      );`,
    ],
  },
];
