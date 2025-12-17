
import { unstable_cache } from 'next/cache';

// Wrapper for unstable_cache to provide types and simpler interface
export function cacheable<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  keyParts: string[],
  options: { revalidate?: number | false; tags?: string[] } = {}
) {
  return unstable_cache(fn, keyParts, options);
}
