import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { fieldErrors } from './validation';

/**
 * Uniform JSON responses. Every failure the browser sees is a plain message
 * and an optional per-field map — stack traces and driver internals never
 * cross the network.
 */

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

export const fail = (message: string, status = 400, fields?: Record<string, string>) =>
  NextResponse.json({ error: message, fields }, { status });

export const unauthorized = (message = 'Please sign in to continue') => fail(message, 401);
export const forbidden = (message = 'You do not have access to this') => fail(message, 403);
export const notFound = (message = 'Not found') => fail(message, 404);

export const validationFailed = (error: ZodError) =>
  fail('Please check the highlighted fields', 422, fieldErrors(error));

export const tooManyRequests = (retryAfterSeconds: number) =>
  NextResponse.json(
    { error: `Too many attempts. Please try again in ${retryAfterSeconds} seconds.` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );

/**
 * Wraps a handler so an unexpected throw becomes a 500 with a generic message.
 * The real error is logged server-side where only the operator can read it.
 */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    console.error('[api]', error);
    return fail('Something went wrong on our side. Please try again.', 500);
  }
}

/** Parses a JSON body without throwing on malformed input. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
