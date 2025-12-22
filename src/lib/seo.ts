
import { query, execute } from './db';
import { Metadata } from 'next';

export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  robots?: string;
  ogData?: any;
}

export type SeoMetadata = SeoData;

/**
 * Fetches SEO metadata from the database for a specific entity.
 * Falls back to provided defaults if no DB entry exists.
 */
export async function getSeoMetadata(
  entityType: 'product' | 'category' | 'page' | 'home',
  entityId: string,
  defaults?: SeoData
): Promise<Metadata> {
  try {
    const rows = await query<any>(`
      SELECT * FROM seo_metadata 
      WHERE entity_type = ? AND entity_id = ?
    `, [entityType, entityId]);

    const dbSeo = rows[0] || {};
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 1. Title
    const title = dbSeo.title || defaults?.title || 'Shopify Lite';

    // 2. Description
    const description = dbSeo.description || defaults?.description || '';

    // 3. Robots
    const robots = dbSeo.robots || defaults?.robots || 'index, follow';

    // 4. Canonical
    let canonical = dbSeo.canonical_url || defaults?.canonicalUrl;
    if (canonical && !canonical.startsWith('http')) {
      canonical = `${baseUrl}${canonical.startsWith('/') ? '' : '/'}${canonical}`;
    }

    // 5. Open Graph
    let openGraph: any = defaults?.ogData || {};
    if (dbSeo.og_data) {
      try {
        const dbOg = typeof dbSeo.og_data === 'string' ? JSON.parse(dbSeo.og_data) : dbSeo.og_data;
        openGraph = { ...openGraph, ...dbOg };
      } catch (e) {
        console.error('Failed to parse OG data', e);
      }
    }

    // Default OG Image if not set
    if (!openGraph.images && defaults?.ogData?.images) {
      openGraph.images = defaults.ogData.images;
    }

    return {
      title,
      description,
      robots,
      alternates: {
        canonical: canonical || null,
      },
      openGraph: {
        title: openGraph.title || title,
        description: openGraph.description || description,
        url: canonical,
        siteName: 'Shopify Lite',
        locale: 'en_US',
        type: 'website',
        ...openGraph,
      },
      twitter: {
        card: 'summary_large_image',
        title: openGraph.title || title,
        description: openGraph.description || description,
        images: openGraph.images,
      }
    };
  } catch (error) {
    console.error('SEO Fetch Error:', error);
    // Return basic defaults on error
    return {
      title: defaults?.title || 'Shopify Lite',
      description: defaults?.description,
    };
  }
}

/**
 * Helper to construct a full canonical URL from a path.
 */
export function getCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export async function updateSeoMetadata(
  entityType: 'product' | 'category' | 'page' | 'home',
  entityId: string,
  data: Partial<SeoMetadata>
) {
  // Check if exists
  const existing = await query('SELECT id FROM seo_metadata WHERE entity_type = ? AND entity_id = ?', [entityType, entityId]);

  if (existing.length > 0) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.keywords !== undefined) { updates.push('keywords = ?'); values.push(data.keywords); }
    if (data.canonicalUrl !== undefined) { updates.push('canonical_url = ?'); values.push(data.canonicalUrl); }
    if (data.robots !== undefined) { updates.push('robots = ?'); values.push(data.robots); }
    if (data.ogData !== undefined) { updates.push('og_data = ?'); values.push(JSON.stringify(data.ogData)); }

    if (updates.length > 0) {
      values.push(existing[0].id);
      await execute(`UPDATE seo_metadata SET ${updates.join(', ')} WHERE id = ?`, values);
    }
  } else {
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

export async function createRedirect(source: string, target: string, statusCode: number = 301) {
  // Check collision
  const existing = await query('SELECT id FROM url_redirects WHERE source_path = ?', [source]);
  if (existing.length > 0) {
    await execute('UPDATE url_redirects SET target_path = ?, status_code = ? WHERE id = ?', [target, statusCode, existing[0].id]);
  } else {
    await execute('INSERT INTO url_redirects (source_path, target_path, status_code) VALUES (?, ?, ?)', [source, target, statusCode]);
  }
}
