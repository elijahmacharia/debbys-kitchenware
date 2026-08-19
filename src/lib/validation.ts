import { z } from 'zod';

/**
 * Shared schemas. The same objects run on the client for instant feedback and
 * on the server as the actual gate — client validation is a convenience, never
 * a control. Every API route re-parses its input with these.
 */

// --- Kenyan phone numbers ----------------------------------------------------

/**
 * Accepts the formats Kenyans actually type: 0712345678, 0112345678,
 * +254712345678, 254712345678, and versions with spaces or dashes.
 * Everything is stored normalised as +2547XXXXXXXX / +2541XXXXXXXX.
 */
export function normalizeKenyanPhone(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, '').replace(/^\+/, '');
  let local: string;
  if (/^254(7|1)\d{8}$/.test(digits)) local = digits.slice(3);
  else if (/^0(7|1)\d{8}$/.test(digits)) local = digits.slice(1);
  else if (/^(7|1)\d{8}$/.test(digits)) local = digits;
  else return null;
  return `+254${local}`;
}

export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .transform((value, ctx) => {
    const normalized = normalizeKenyanPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid Kenyan phone number, e.g. 0712345678' });
      return z.NEVER;
    }
    return normalized;
  });

/** Pretty form for display: +254712345678 -> 0712 345 678 */
export function displayPhone(stored: string): string {
  const m = /^\+254(\d{3})(\d{3})(\d{3})$/.exec(stored);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : stored;
}

// --- Primitives --------------------------------------------------------------

export const nameSchema = z
  .string().trim()
  .min(2, 'Please enter your full name')
  .max(80, 'Name is too long')
  .regex(/^[\p{L}\p{M}'.\- ]+$/u, 'Name contains characters we cannot accept');

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(160);
export const optionalEmailSchema = z
  .union([emailSchema, z.literal('')])
  .optional()
  .transform((v) => (v ? v : undefined));

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const quantitySchema = z.coerce.number()
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(999, 'Quantity is too large');

const shortText = (max: number) => z.string().trim().max(max);

// --- Accounts ----------------------------------------------------------------

/**
 * Signing up asks for an email and a password, nothing else. The shorter the
 * form, the more people finish it — and a phone number is still collected at
 * checkout, where it is genuinely needed to arrange a delivery.
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  marketingOptIn: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  // Still accepts a phone number: accounts created before this change sign in
  // exactly as they did, and the route resolves either form.
  identifier: z.string().trim().min(1, 'Enter your email address'),
  password: z.string().min(1, 'Enter your password'),
});

/** The profile page is where a name and phone can be filled in later. */
export const profileSchema = z.object({
  name: z.union([nameSchema, z.literal('')]).optional().transform((v) => (v ? v : undefined)),
  phone: z.union([phoneSchema, z.literal('')]).optional().transform((v) => (v ? v : undefined)),
  email: emailSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({ identifier: z.string().trim().min(1) });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

// --- Addresses ---------------------------------------------------------------

/**
 * Deliberately loose about "street address" — most Kenyan customers navigate by
 * estate and landmark, not by a formal street number, so county/town/area are
 * required and building/landmark/directions are optional free text.
 */
export const addressSchema = z.object({
  label: shortText(30).default('Home'),
  recipientName: nameSchema,
  phone: phoneSchema,
  county: shortText(60).min(1, 'Select a county'),
  town: shortText(60).min(1, 'Town is required'),
  area: shortText(80).min(1, 'Area is required'),
  estate: shortText(80).optional(),
  building: shortText(80).optional(),
  landmark: shortText(120).optional(),
  directions: shortText(400).optional(),
  isDefault: z.boolean().optional().default(false),
});

// --- Checkout ----------------------------------------------------------------

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: quantitySchema,
});

export const checkoutSchema = z
  .object({
    items: z.array(cartLineSchema).min(1, 'Your cart is empty').max(60),
    customerName: nameSchema,
    customerPhone: phoneSchema,
    customerEmail: optionalEmailSchema,
    fulfilment: z.enum(['DELIVERY', 'PICKUP']),
    paymentMethod: z.enum(['WHATSAPP', 'MPESA_TILL', 'MPESA_PAYBILL', 'MPESA_SEND_MONEY', 'CASH_ON_DELIVERY', 'PAY_ON_PICKUP']),
    deliveryZoneId: z.string().optional(),
    county: shortText(60).optional(),
    town: shortText(60).optional(),
    area: shortText(80).optional(),
    estate: shortText(80).optional(),
    building: shortText(80).optional(),
    landmark: shortText(120).optional(),
    directions: shortText(400).optional(),
    mapUrl: shortText(500).optional(),
    customerNote: shortText(500).optional(),
    saveAddress: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.fulfilment === 'DELIVERY') {
      const required: Array<['deliveryZoneId' | 'county' | 'town' | 'area', string]> = [
        ['deliveryZoneId', 'Choose a delivery area'],
        ['county', 'County is required for delivery'],
        ['town', 'Town is required for delivery'],
        ['area', 'Area is required for delivery'],
      ];
      for (const [field, message] of required) {
        if (!data[field]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
      }
      if (data.paymentMethod === 'PAY_ON_PICKUP') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, path: ['paymentMethod'],
          message: 'Pay on pickup is only available for shop collection',
        });
      }
    }
    if (data.fulfilment === 'PICKUP' && data.paymentMethod === 'CASH_ON_DELIVERY') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom, path: ['paymentMethod'],
        message: 'Cash on delivery is only available for delivery orders',
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// --- Contact -----------------------------------------------------------------

export const contactSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema,
  subject: shortText(120).min(3, 'Please add a subject'),
  body: shortText(2000).min(10, 'Please tell us a little more'),
  /**
   * Honeypot. Accepts any value on purpose: rejecting it with a validation
   * error would tell a bot exactly which field gave it away. The route checks
   * the value and answers with a normal success message instead.
   */
  website: z.string().max(200).optional(),
});

// --- Admin -------------------------------------------------------------------

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(140),
  sku: z.string().trim().min(1, 'SKU is required').max(40)
    .regex(/^[A-Za-z0-9._-]+$/, 'SKU can only contain letters, numbers, dot, dash and underscore'),
  description: z.string().trim().min(10, 'Add a short description').max(4000),
  keywords: shortText(300).optional().default(''),
  categoryId: z.string().min(1, 'Choose a category'),
  priceCents: z.coerce.number().int().min(1, 'Price must be greater than zero').max(100_000_000),
  salePriceCents: z.coerce.number().int().min(0).max(100_000_000).nullable().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative').max(1_000_000),
  lowStockAt: z.coerce.number().int().min(0).max(10_000).default(5),
  unit: shortText(20).default('each'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  metaTitle: shortText(70).optional(),
  metaDescription: shortText(180).optional(),
  images: z.array(z.object({ url: z.string().min(1).max(500), alt: shortText(160) })).max(8).default([]),
}).superRefine((data, ctx) => {
  if (data.salePriceCents && data.salePriceCents >= data.priceCents) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom, path: ['salePriceCents'],
      message: 'Sale price must be lower than the normal price, otherwise it is not a discount',
    });
  }
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required').max(80),
  description: shortText(600).optional(),
  imageUrl: shortText(500).optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(2, 'Zone name is required').max(80),
  county: z.string().trim().min(2).max(60).default('Nairobi'),
  feeCents: z.coerce.number().int().min(0, 'Fee cannot be negative').max(10_000_000),
  etaText: shortText(60).default('1-2 days'),
  note: shortText(200).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const orderStatusSchema = z.object({
  status: z.enum(['NEW', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  note: shortText(300).optional(),
});

export const paymentUpdateSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED', 'FAILED']),
  paymentReference: shortText(60).optional(),
});

export const stockAdjustSchema = z.object({
  productId: z.string().min(1),
  /** The new absolute stock figure the owner counted on the shelf. */
  newStock: z.coerce.number().int().min(0).max(1_000_000),
  note: shortText(200).optional(),
});

/** Flattens a ZodError into { field: message } for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
