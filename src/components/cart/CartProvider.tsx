'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useToast } from '@/components/ui/Toast';

/**
 * CART
 * -----------------------------------------------------------------------------
 * The cart lives in localStorage so a guest can shop, close the tab and come
 * back to their basket, and so add-to-cart feels instant.
 *
 * Three rules keep that safe:
 *  1. Prices held here are for DISPLAY ONLY. The order API re-reads every price
 *     from the database, so editing localStorage changes nothing but your own
 *     screen.
 *  2. On load, and again before the order is submitted, the cart is revalidated
 *     against the server: prices refresh, and items that went out of stock or
 *     were withdrawn are flagged to the customer rather than silently dropped.
 *  3. For a signed-in customer the cart is mirrored to the database so it
 *     follows them to another device, and a guest cart is merged on sign-in.
 */

const STORAGE_KEY = 'dk.cart.v1';

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  /** Price actually charged per unit, in cents. Refreshed from the server. */
  unitPriceCents: number;
  /** Pre-discount price, so the cart can show a strike-through. */
  listPriceCents: number;
  quantity: number;
  /** Last known stock, used to cap the quantity stepper. */
  stock: number;
  unit: string;
}

export interface CartIssue {
  productId: string;
  name: string;
  kind: 'REMOVED' | 'OUT_OF_STOCK' | 'REDUCED_QUANTITY' | 'PRICE_CHANGED';
  message: string;
}

interface CartContextValue {
  lines: CartLine[];
  issues: CartIssue[];
  /** False until localStorage has been read — prevents a hydration mismatch. */
  ready: boolean;
  count: number;
  subtotalCents: number;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  dismissIssues: () => void;
  revalidate: () => Promise<CartIssue[]>;
  mergeServerCart: (items: { productId: string; quantity: number }[]) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive: a hand-edited or stale entry must not crash the whole app.
    return parsed.filter(
      (line): line is CartLine =>
        line && typeof line.productId === 'string' && Number.isFinite(line.quantity) && line.quantity > 0,
    );
  } catch {
    return [];
  }
}

interface ServerProduct {
  id: string; name: string; slug: string; sku: string; isActive: boolean;
  stock: number; unit: string; listPriceCents: number; unitPriceCents: number; imageUrl: string | null;
}

export function CartProvider({ children, isSignedIn }: { children: ReactNode; isSignedIn: boolean }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [issues, setIssues] = useState<CartIssue[]>([]);
  const [ready, setReady] = useState(false);
  const { push } = useToast();
  const didInitialValidate = useRef(false);

  useEffect(() => {
    setLines(readStorage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be full or blocked in private mode. The cart still works
      // for this page view; there is nothing useful to tell the customer.
    }
  }, [lines, ready]);

  // Keep other tabs in step.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setLines(readStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const revalidate = useCallback(async (): Promise<CartIssue[]> => {
    const current = readStorage();
    if (current.length === 0) {
      setIssues([]);
      return [];
    }
    try {
      const response = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: current.map((l) => l.productId) }),
      });
      if (!response.ok) return [];
      const data = (await response.json()) as { products: ServerProduct[] };

      const byId = new Map(data.products.map((p) => [p.id, p]));
      const found: CartIssue[] = [];
      const next: CartLine[] = [];

      for (const line of current) {
        const server = byId.get(line.productId);
        if (!server || !server.isActive) {
          found.push({ productId: line.productId, name: line.name, kind: 'REMOVED', message: `${line.name} is no longer available and was removed from your cart.` });
          continue;
        }
        if (server.stock <= 0) {
          found.push({ productId: line.productId, name: server.name, kind: 'OUT_OF_STOCK', message: `${server.name} is out of stock and was removed from your cart.` });
          continue;
        }
        const quantity = Math.min(line.quantity, server.stock);
        if (quantity < line.quantity) {
          found.push({ productId: line.productId, name: server.name, kind: 'REDUCED_QUANTITY', message: `Only ${server.stock} of ${server.name} left, so we reduced your quantity.` });
        }
        if (server.unitPriceCents !== line.unitPriceCents) {
          found.push({ productId: line.productId, name: server.name, kind: 'PRICE_CHANGED', message: `The price of ${server.name} has changed.` });
        }
        next.push({
          ...line,
          name: server.name, slug: server.slug, sku: server.sku,
          imageUrl: server.imageUrl, unitPriceCents: server.unitPriceCents,
          listPriceCents: server.listPriceCents, stock: server.stock, unit: server.unit,
          quantity,
        });
      }

      setLines(next);
      setIssues(found);
      return found;
    } catch {
      // Offline or a flaky connection. Keep the cart as it is; the server
      // validates again before anything is committed.
      return [];
    }
  }, []);

  // Revalidate once per page load, after hydration.
  useEffect(() => {
    if (!ready || didInitialValidate.current) return;
    didInitialValidate.current = true;
    void revalidate();
  }, [ready, revalidate]);

  // Mirror to the server for signed-in customers, debounced so one write
  // follows a burst of clicks rather than one per click.
  useEffect(() => {
    if (!ready || !isSignedIn) return;
    const timer = window.setTimeout(() => {
      void fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }),
      }).catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [lines, ready, isSignedIn]);

  const beacon = (type: string, label?: string) => {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, label }),
    }).catch(() => undefined);
  };

  const add: CartContextValue['add'] = useCallback((line, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((l) => l.productId === line.productId);
      if (existing) {
        const wanted = existing.quantity + quantity;
        const capped = Math.min(wanted, line.stock);
        if (capped === existing.quantity) {
          push(`You already have all ${line.stock} available in your cart`, 'info');
          return current;
        }
        if (capped < wanted) push(`Only ${line.stock} available, quantity set to ${capped}`, 'info');
        else push(`${line.name} added to cart`);
        return current.map((l) => (l.productId === line.productId ? { ...l, ...line, quantity: capped } : l));
      }
      push(`${line.name} added to cart`);
      return [...current, { ...line, quantity: Math.min(quantity, line.stock) }];
    });
    beacon('ADD_TO_CART', line.sku);
  }, [push]);

  const setQuantity: CartContextValue['setQuantity'] = useCallback((productId, quantity) => {
    setLines((current) => {
      const line = current.find((l) => l.productId === productId);
      if (!line) return current;
      // Guards against a negative or absurd value typed into the input.
      const safe = Math.max(1, Math.min(Math.floor(quantity) || 1, Math.max(1, line.stock)));
      return current.map((l) => (l.productId === productId ? { ...l, quantity: safe } : l));
    });
  }, []);

  const remove: CartContextValue['remove'] = useCallback((productId) => {
    setLines((current) => {
      const line = current.find((l) => l.productId === productId);
      if (line) {
        push(`${line.name} removed`, 'info');
        beacon('REMOVE_FROM_CART', line.sku);
      }
      return current.filter((l) => l.productId !== productId);
    });
  }, [push]);

  const clear = useCallback(() => {
    setLines([]);
    setIssues([]);
  }, []);

  const dismissIssues = useCallback(() => setIssues([]), []);

  /**
   * Merges the cart saved on the customer's account into this browser's cart,
   * called immediately after sign-in.
   *
   * Quantities are combined with max(), not sum(). If someone put 2 buckets in
   * their cart on their phone and 3 on their laptop, they meant "3 buckets",
   * not 5 — adding them would quietly inflate the order. Everything is then
   * capped to what is actually in stock.
   */
  const mergeServerCart = useCallback(async (serverItems: { productId: string; quantity: number }[]) => {
    if (serverItems.length === 0) return;
    const local = readStorage();

    const wanted = new Map<string, number>();
    for (const line of local) wanted.set(line.productId, line.quantity);
    for (const item of serverItems) {
      wanted.set(item.productId, Math.max(wanted.get(item.productId) ?? 0, item.quantity));
    }

    try {
      const response = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(wanted.keys()) }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { products: ServerProduct[] };

      const merged: CartLine[] = [];
      for (const server of data.products) {
        if (!server.isActive || server.stock <= 0) continue;
        merged.push({
          productId: server.id, slug: server.slug, name: server.name, sku: server.sku,
          imageUrl: server.imageUrl, unitPriceCents: server.unitPriceCents,
          listPriceCents: server.listPriceCents, stock: server.stock, unit: server.unit,
          quantity: Math.min(wanted.get(server.id) ?? 1, server.stock),
        });
      }
      setLines(merged);
      if (merged.length > local.length) push('We restored the items saved to your account', 'info');
    } catch {
      // Merge is a convenience. Failing it must not block signing in.
    }
  }, [push]);

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotalCents = useMemo(() => lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({ lines, issues, ready, count, subtotalCents, add, setQuantity, remove, clear, dismissIssues, revalidate, mergeServerCart }),
    [lines, issues, ready, count, subtotalCents, add, setQuantity, remove, clear, dismissIssues, revalidate, mergeServerCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}

/** Clears the stored cart from outside React (used after a confirmed order). */
export function clearStoredCart() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
