import { endCustomerSession } from '@/lib/auth';
import { handle, ok } from '@/lib/api';

/**
 * POST only. A GET logout could be triggered by any image tag on any site,
 * which is a nuisance-level CSRF; requiring POST plus the SameSite=Lax cookie
 * rules that out.
 */
export async function POST() {
  return handle(async () => {
    await endCustomerSession();
    return ok({ signedOut: true });
  });
}
