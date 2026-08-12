import { endAdminSession } from '@/lib/auth';
import { handle, ok } from '@/lib/api';

export async function POST() {
  return handle(async () => {
    await endAdminSession();
    return ok({ signedOut: true });
  });
}
