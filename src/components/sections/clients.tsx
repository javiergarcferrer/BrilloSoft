import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/reveal";
import { CLIENTS } from "@/lib/site";

export function Clients() {
  // Duplicate the list so the marquee can loop seamlessly.
  const items = [...CLIENTS, ...CLIENTS];

  return (
    <section
      id="clientes"
      className="scroll-mt-24 border-y border-hairline bg-surface-soft py-16 sm:py-20"
    >
      <Container>
        <Reveal className="text-center">
          <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">
            Con la confianza de marcas líderes
          </p>
        </Reveal>
      </Container>

      <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="vv-marquee flex w-max items-center gap-16 pr-16">
          {items.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="font-display text-2xl font-semibold whitespace-nowrap text-ink-soft/70 sm:text-3xl"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
