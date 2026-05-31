import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
});

const title = `${site.name} — ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "limpieza profesional",
    "empresa de limpieza",
    "mantenimiento",
    "limpieza de tapicería",
    "limpieza de alfombras",
    "limpieza de oficinas",
    "limpieza de hogar",
    "Santo Domingo",
    "República Dominicana",
    "Vista Verde",
    "Ecolab",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: site.url,
    siteName: site.name,
    title,
    description: site.description,
    images: [{ url: "/images/dsc06838.jpg", alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: ["/images/dsc06838.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "business",
};

export const viewport: Viewport = {
  themeColor: "#1f6f46",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${site.url}/#business`,
  name: site.name,
  description: site.description,
  slogan: site.tagline,
  url: site.url,
  telephone: `+${site.phoneE164}`,
  email: site.email,
  image: `${site.url}/icon.svg`,
  priceRange: "$$",
  areaServed: { "@type": "Country", name: site.country },
  address: { "@type": "PostalAddress", addressCountry: "DO" },
  sameAs: [site.instagram.url],
  knowsAbout: [
    "Limpieza de materiales delicados",
    "Limpieza de superficies",
    "Limpieza integral",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-dvh">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('IntersectionObserver' in window){document.documentElement.classList.add('reveal-ready')}",
          }}
        />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
