/**
 * Layout for Shopify Intelligence (embedded in Shopify Admin or standalone).
 * Keeps the app layer minimal; no App Bridge required for cookie-based session.
 */
export default function ShopifyIntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
