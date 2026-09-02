import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-5xl font-semibold tracking-tight text-brand-700">
        {SITE.name}
      </h1>
      <p className="text-lg text-ink-soft">{SITE.tagline}</p>
      <p className="text-sm text-ink-soft">{SITE.domain}</p>
    </main>
  );
}
