
import { execute, query } from './db';

export type SeoEntityType = 'product' | 'category' | 'page' | 'home';

export interface SeoMetadata {
  id?: number;
  entityType: SeoEntityType;
  entityId: string;
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  robots?: string;
  ogData?: any;
}

export interface Redirect {
  id: number;
  sourcePath: string;
  targetPath: string;
  statusCode: number;
  active: boolean;
}

// --- SEO Metadata Operations ---

export async function getSeoMetadata(entityType: SeoEntityType, entityId: string): Promise<SeoMetadata | null> {
  const rows = await query(
    'SELECT * FROM seo_metadata WHERE entity_type = ? AND entity_id = ?',
    [entityType, entityId]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    description: row.description,
    keywords: row.keywords,
    canonicalUrl: row.canonical_url,
    robots: row.robots,
    ogData: row.og_data ? (typeof row.og_data === 'string' ? JSON.parse(row.og_data) : row.og_data) : null,
  };
}

export async function updateSeoMetadata(entityType: SeoEntityType, entityId: string, data: Partial<SeoMetadata>) {
  // Check if exists
  const existing = await getSeoMetadata(entityType, entityId);

  if (existing) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.keywords !== undefined) { updates.push('keywords = ?'); values.push(data.keywords); }
    if (data.canonicalUrl !== undefined) { updates.push('canonical_url = ?'); values.push(data.canonicalUrl); }
    if (data.robots !== undefined) { updates.push('robots = ?'); values.push(data.robots); }
    if (data.ogData !== undefined) { updates.push('og_data = ?'); values.push(JSON.stringify(data.ogData)); }

    if (updates.length > 0) {
      values.push(existing.id);
      await execute(`UPDATE seo_metadata SET ${updates.join(', ')} WHERE id = ?`, values);
    }
  } else {
    // Insert
    await execute(
      `INSERT INTO seo_metadata (entity_type, entity_id, title, description, keywords, canonical_url, robots, og_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entityType,
        entityId,
        data.title || null,
        data.description || null,
        data.keywords || null,
        data.canonicalUrl || null,
        data.robots || 'index, follow',
        data.ogData ? JSON.stringify(data.ogData) : null
      ]
    );
  }
}

// --- URL Redirect Operations ---

export async function createRedirect(sourcePath: string, targetPath: string, statusCode = 301) {
  // Check if source already exists
  const existing = await query('SELECT id FROM url_redirects WHERE source_path = ?', [sourcePath]);

  if (existing.length > 0) {
    // Update target
    await execute(
      'UPDATE url_redirects SET target_path = ?, status_code = ?, active = TRUE WHERE id = ?',
      [targetPath, statusCode, existing[0].id]
    );
  } else {
    // Insert new
    await execute(
      'INSERT INTO url_redirects (source_path, target_path, status_code, active) VALUES (?, ?, ?, TRUE)',
      [sourcePath, targetPath, statusCode]
    );
  }
}

export async function resolveRedirect(path: string): Promise<Redirect | null> {
  const rows = await query('SELECT * FROM url_redirects WHERE source_path = ? AND active = TRUE', [path]);

  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    sourcePath: rows[0].source_path,
    targetPath: rows[0].target_path,
    statusCode: rows[0].status_code,
    active: rows[0].active === 1
  };
}

export async function deleteRedirect(sourcePath: string) {
  await execute('DELETE FROM url_redirects WHERE source_path = ?', [sourcePath]);
}
