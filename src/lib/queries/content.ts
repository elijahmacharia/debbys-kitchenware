import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { deliveryZones, testimonials } from '@/db/schema';

/**
 * Only published testimonials are ever returned. Nothing is generated, and the
 * seed inserts none — a shop with no reviews yet shows no reviews.
 */
export async function getPublishedTestimonials() {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isPublished, true))
    .orderBy(asc(testimonials.sortOrder));
}

/** Zones a customer can actually choose at checkout. */
export async function getActiveDeliveryZones() {
  return db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.isActive, true))
    .orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.name));
}

export async function getAllDeliveryZones() {
  return db.select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.name));
}
