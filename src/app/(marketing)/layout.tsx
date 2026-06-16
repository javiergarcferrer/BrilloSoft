import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Chrome for the public marketing site (Vista Verde). Lives in a route group so
 * utility routes like /nomina can opt out of the header/footer and render their
 * own full-width layout.
 */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main id="inicio">{children}</main>
      <SiteFooter />
    </>
  );
}
