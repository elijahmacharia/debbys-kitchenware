import { searchSuggestions } from '@/lib/queries/products';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fail, handle, ok, tooManyRequests } from '@/lib/api';

/** Typeahead for the header search box. Public, read-only, rate limited. */
export async function GET(request: Request) {
  return handle(async () => {
    const limit = rateLimit(clientKey(request, 'suggest'), 60, 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const term = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    if (term.length < 2) return ok({ results: [] });
    if (term.length > 80) return fail('Search term is too long');

    return ok({ results: await searchSuggestions(term, 6) });
  });
}
