"use client";

import { Mail, MapPin, Send } from "lucide-react";
import { useState } from "react";
import {
  DEFAULT_WHATSAPP_MESSAGE,
  mailtoUrl,
  services,
  site,
  whatsappUrl,
} from "@/lib/site";
import { cn } from "@/lib/utils";
import { InstagramIcon, WhatsappIcon } from "./brand-icons";
import { SectionHeading } from "./section-heading";

const fieldClass =
  "w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-ink transition-colors placeholder:text-ink-soft/55 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100";

export function Contact() {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    servicio: services[0].name,
    mensaje: "",
  });

  const update =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `¡Hola Vista Verde! Soy ${form.nombre.trim() || "un cliente"}.`,
      `Me interesa: ${form.servicio}.`,
      form.mensaje.trim() || null,
      form.telefono.trim() ? `Mi teléfono: ${form.telefono.trim()}` : null,
    ].filter(Boolean) as string[];
    window.open(
      whatsappUrl(lines.join("\n")),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section id="contacto" className="bg-cream py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Channels */}
        <div>
          <SectionHeading
            align="left"
            eyebrow="Contacto"
            title={
              <>
                Hablemos de{" "}
                <span className="italic text-brand-600">tu espacio</span>
              </>
            }
            lead="Pide tu evaluación gratuita. Te respondemos rápido y sin compromiso."
          />

          <ul className="mt-9 space-y-4">
            <li>
              <a
                href={whatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
              >
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <WhatsappIcon className="size-6" />
                </span>
                <span>
                  <span className="block text-sm text-ink-soft">WhatsApp</span>
                  <span className="font-medium text-ink">
                    {site.phoneDisplay}
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={mailtoUrl("Solicitud de evaluación — Vista Verde")}
                className="group flex items-center gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
              >
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Mail className="size-6" strokeWidth={1.7} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-ink-soft">Correo</span>
                  <span className="block truncate font-medium text-ink">
                    {site.email}
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={site.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
              >
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <InstagramIcon className="size-6" />
                </span>
                <span>
                  <span className="block text-sm text-ink-soft">Instagram</span>
                  <span className="font-medium text-ink">
                    {site.instagram.handle}
                  </span>
                </span>
              </a>
            </li>
            <li className="flex items-center gap-4 rounded-2xl border border-transparent p-5">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100/60 text-brand-700">
                <MapPin className="size-6" strokeWidth={1.7} />
              </span>
              <span>
                <span className="block text-sm text-ink-soft">Cobertura</span>
                <span className="font-medium text-ink">
                  {site.serviceArea} · {site.country}
                </span>
              </span>
            </li>
          </ul>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-hairline bg-surface p-7 shadow-card sm:p-9">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Nombre</span>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={update("nombre")}
                  placeholder="Tu nombre"
                  className={cn(fieldClass, "mt-2")}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">
                  Teléfono{" "}
                  <span className="font-normal text-ink-soft">(opcional)</span>
                </span>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={update("telefono")}
                  placeholder="(809) 000-0000"
                  className={cn(fieldClass, "mt-2")}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-ink">
                ¿Qué necesitas?
              </span>
              <select
                value={form.servicio}
                onChange={update("servicio")}
                className={cn(fieldClass, "mt-2 appearance-none")}
              >
                {services.map((service) => (
                  <option key={service.id} value={service.name}>
                    {service.name}
                  </option>
                ))}
                <option value="Otro / no estoy seguro">
                  Otro / no estoy seguro
                </option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">
                Mensaje{" "}
                <span className="font-normal text-ink-soft">(opcional)</span>
              </span>
              <textarea
                rows={4}
                value={form.mensaje}
                onChange={update("mensaje")}
                placeholder="Cuéntanos sobre tu espacio…"
                className={cn(fieldClass, "mt-2 resize-none")}
              />
            </label>

            <button
              type="submit"
              className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-base font-medium text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <Send className="size-5" />
              Enviar por WhatsApp
            </button>

            <p className="text-center text-sm text-ink-soft">
              ¿Prefieres correo?{" "}
              <a
                href={mailtoUrl("Solicitud de evaluación — Vista Verde")}
                className="font-medium text-brand-700 underline-offset-4 hover:underline"
              >
                Escríbenos aquí
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
