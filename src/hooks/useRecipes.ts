import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';
import { RECIPES, type Recipe } from '../recipes/recipeData';

export interface UserRecipe extends Recipe {
  custom: true;
  created_at: string;
}

function generateId(): string {
  return `usr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToUserRecipe(r: Record<string, unknown>): UserRecipe {
  return {
    id: r.id as string,
    name: r.name as string,
    emoji: r.emoji as string,
    prepMin: r.prep_min as number,
    cookMin: r.cook_min as number,
    tags: JSON.parse((r.tags as string) || '[]') as string[],
    ingredients: JSON.parse((r.ingredients as string) || '[]') as string[],
    steps: JSON.parse((r.steps as string) || '[]') as string[],
    kcalPerServing: r.kcal_per_serving != null ? (r.kcal_per_serving as number) : undefined,
    custom: true,
    created_at: r.created_at as string,
  };
}

export function useRecipes() {
  const [userRecipes, setUserRecipes] = useState<UserRecipe[]>([]);
  const [deletedSeedIds, setDeletedSeedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const db = getDb();
      const [recipesResult, deletedResult] = await Promise.all([
        db.query('SELECT * FROM recipes ORDER BY created_at DESC;', []),
        db.query('SELECT id FROM deleted_seed_recipes;', []),
      ]);
      setUserRecipes((recipesResult.values ?? []).map((r: Record<string, unknown>) => rowToUserRecipe(r)));
      setDeletedSeedIds(new Set((deletedResult.values ?? []).map((r: Record<string, unknown>) => r.id as string)));
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /**
   * Seed recipes first, then user-created newest-first.
   * Seed recipes that have been explicitly deleted are excluded.
   */
  const allRecipes: Array<Recipe & { custom?: true }> = [
    ...RECIPES.filter((r) => !deletedSeedIds.has(r.id)),
    ...userRecipes,
  ];

  const addRecipe = useCallback(
    async (draft: Omit<Recipe, 'id'>) => {
      const id = generateId();
      const created_at = new Date().toISOString();
      try {
        const db = getDb();
        await db.run(
          `INSERT INTO recipes (id, name, emoji, prep_min, cook_min, tags, ingredients, steps, kcal_per_serving, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            id,
            draft.name,
            draft.emoji,
            draft.prepMin,
            draft.cookMin,
            JSON.stringify(draft.tags),
            JSON.stringify(draft.ingredients),
            JSON.stringify(draft.steps),
            draft.kcalPerServing ?? null,
            created_at,
          ]
        );
        await loadAll();
      } catch (err) {
        console.error('Failed to add recipe:', err);
        throw err;
      }
    },
    [loadAll]
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
      try {
        const db = getDb();
        await db.run('DELETE FROM recipes WHERE id = ?;', [id]);
        await loadAll();
      } catch (err) {
        console.error('Failed to delete recipe:', err);
        throw err;
      }
    },
    [loadAll]
  );

  const deleteSeedRecipe = useCallback(
    async (id: string) => {
      try {
        const db = getDb();
        await db.run('INSERT OR IGNORE INTO deleted_seed_recipes (id) VALUES (?);', [id]);
        await loadAll();
      } catch (err) {
        console.error('Failed to delete seed recipe:', err);
        throw err;
      }
    },
    [loadAll]
  );

  return { allRecipes, userRecipes, loading, addRecipe, deleteRecipe, deleteSeedRecipe };
}
