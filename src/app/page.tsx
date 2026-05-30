import { Clients } from "@/components/site/clients";
import { Contact } from "@/components/site/contact";
import { Eco } from "@/components/site/eco";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { Process } from "@/components/site/process";
import { Services } from "@/components/site/services";
import { WhyUs } from "@/components/site/why-us";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Process />
        <WhyUs />
        <Eco />
        <Clients />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
