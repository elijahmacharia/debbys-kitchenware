import 'server-only';
import { track } from '@/lib/analytics';

/**
 * Search terms are recorded with their result count, which is the single most
 * useful signal the owner has: a popular search returning zero results is a
 * product worth stocking or a keyword worth adding.
 */
export async function trackSearch(term: string, resultCount: number) {
  await track('SEARCH', `${term} (${resultCount} results)`);
}
