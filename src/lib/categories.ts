import { query, execute } from './db';

export interface CategoryTranslation {
  locale: string;
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
}

export interface Category {
  id: string;
  parentId?: string;
  position: number;
  level: number;
  path: string;
  isActive: boolean;
  translations: Record<string, CategoryTranslation>;
  children?: Category[];
}

/**
 * Fetches all categories with their translations for a specific locale
 * and returns them as a hierarchical tree.
 */
export async function getCategoryTree(locale: string = 'en-GB'): Promise<Category[]> {
  const sql = `
    SELECT 
      c.id, c.parent_id, c.position, c.level, c.path, c.status,
      ct.name, ct.description, ct.meta_title, ct.meta_description, ct.slug
    FROM categories c
    LEFT JOIN category_translations ct ON c.id = ct.category_id AND ct.locale = ?
    ORDER BY c.level ASC, c.position ASC
  `;

  const rows = await query(sql, [locale]);

  const categoryMap: Record<string, Category> = {};
  const tree: Category[] = [];

  rows.forEach((row: any) => {
    const category: Category = {
      id: row.id.toString(),
      parentId: row.parent_id ? row.parent_id.toString() : undefined,
      position: row.position,
      level: row.level,
      path: row.path,
      isActive: row.status === 'active',
      translations: {
        [locale]: {
          locale,
          name: row.name || '',
          description: row.description || '',
          metaTitle: row.meta_title || '',
          metaDescription: row.meta_description || '',
          slug: row.slug || ''
        }
      },
      children: []
    };

    categoryMap[category.id] = category;

    if (category.parentId && categoryMap[category.parentId]) {
      categoryMap[category.parentId].children!.push(category);
    } else {
      tree.push(category);
    }
  });

  return tree;
}

/**
 * Creates a new category with translations.
 */
export async function createCategory(data: {
  parentId?: number | null;
  position?: number;
  isActive?: boolean;
  translations: CategoryTranslation[];
}) {
  const parentId = data.parentId || null;
  const position = data.position || 0;
  const status = data.isActive !== false ? 'active' : 'archived';

  // Calculate level and path
  let level = 0;
  let path = '';

  if (parentId) {
    const [parent] = await query('SELECT level, path FROM categories WHERE id = ?', [parentId]);
    if (parent) {
      level = parent.level + 1;
      path = parent.path ? `${parent.path}/${parentId}` : `${parentId}`;
    }
  }

  const result = await execute(
    `INSERT INTO categories (parent_id, position, level, path, status) VALUES (?, ?, ?, ?, ?)`,
    [parentId, position, level, path, status]
  );

  const categoryId = result.insertId;

  // Insert translations
  for (const t of data.translations) {
    await execute(
      `INSERT INTO category_translations (category_id, locale, name, description, meta_title, meta_description, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, t.locale, t.name, t.description || null, t.metaTitle || null, t.metaDescription || null, t.slug]
    );
  }

  return categoryId;
}

/**
 * Updates an existing category and its translations.
 */
export async function updateCategory(id: string, data: {
  parentId?: number | null;
  position?: number;
  isActive?: boolean;
  translations: CategoryTranslation[];
}) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.parentId !== undefined) {
    updates.push('parent_id = ?');
    values.push(data.parentId);

    // Recalculate level and path if parent changes
    let level = 0;
    let path = '';
    if (data.parentId) {
      const [parent] = await query('SELECT level, path FROM categories WHERE id = ?', [data.parentId]);
      if (parent) {
        level = parent.level + 1;
        path = parent.path ? `${parent.path}/${data.parentId}` : `${data.parentId}`;
      }
    }
    updates.push('level = ?', 'path = ?');
    values.push(level, path);
  }

  if (data.position !== undefined) {
    updates.push('position = ?');
    values.push(data.position);
  }

  if (data.isActive !== undefined) {
    updates.push('status = ?');
    values.push(data.isActive ? 'active' : 'archived');
  }

  if (updates.length > 0) {
    values.push(id);
    await execute(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  // Update translations (Upsert style)
  for (const t of data.translations) {
    await execute(
      `INSERT INTO category_translations (category_id, locale, name, description, meta_title, meta_description, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name), 
         description = VALUES(description), 
         meta_title = VALUES(meta_title), 
         meta_description = VALUES(meta_description), 
         slug = VALUES(slug)`,
      [id, t.locale, t.name, t.description || null, t.metaTitle || null, t.metaDescription || null, t.slug]
    );
  }
}

/**
 * Deletes a category and its translations.
 */
export async function deleteCategory(id: string) {
  // Check if it has children first or decide on cascading behavior
  // The DB constraint FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
  // handles children by setting parent_id to null.
  // translations are ON DELETE CASCADE.
  await execute('DELETE FROM categories WHERE id = ?', [id]);
}

/**
 * Updates positions for multiple categories (Batch)
 */
export async function updateCategoryPositions(reorders: { id: string, position: number, parentId?: string | null }[]) {
  for (const item of reorders) {
    const updates = ['position = ?'];
    const values = [item.position];

    if (item.parentId !== undefined) {
      updates.push('parent_id = ?');
      values.push(item.parentId);

      // Level and path would need recalculation for the entire subtree if moved to a different parent
      // For simplicity in drag-n-drop repositioning within same level, we just update position.
    }

    values.push(item.id);
    await execute(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
  }
}
