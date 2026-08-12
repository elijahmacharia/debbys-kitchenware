import { getActiveDeliveryZones } from '@/lib/queries/content';
import { handle, ok } from '@/lib/api';

/** Public: the delivery areas and fees shown at checkout. */
export async function GET() {
  return handle(async () => {
    const zones = await getActiveDeliveryZones();
    return ok({
      zones: zones.map((z) => ({ id: z.id, name: z.name, county: z.county, feeCents: z.feeCents, etaText: z.etaText, note: z.note })),
    });
  });
}
