/**
 * Admin group layout.
 *
 * Intentionally bare: no shop header, no cart, no WhatsApp button, no service
 * worker. Staff screens must never cache customer or order data offline, and
 * the storefront chrome would only be in the way.
 */
export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-1 flex-col bg-canvas">{children}</div>;
}
