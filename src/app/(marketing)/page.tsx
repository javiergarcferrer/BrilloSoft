import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { Process } from "@/components/sections/process";
import { Ecolab } from "@/components/sections/ecolab";
import { Nosotros } from "@/components/sections/nosotros";
import { Clients } from "@/components/sections/clients";
import { Contacto } from "@/components/sections/contacto";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Process />
      <Ecolab />
      <Nosotros />
      <Clients />
      <Contacto />
    </>
  );
}
