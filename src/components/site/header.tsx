"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEFAULT_WHATSAPP_MESSAGE,
  navLinks,
  whatsappUrl,
} from "@/lib/site";
import { cn } from "@/lib/utils";
import { WhatsappIcon } from "./brand-icons";
import { Button } from "./button";
import { Logo } from "./logo";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-hairline/80 bg-canvas/85 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo />

        <nav className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button
            href={whatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
            external
            size="sm"
          >
            <WhatsappIcon className="size-4" />
            Evaluación gratis
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="-mr-1 inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-brand-50 md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-hairline/70 bg-canvas/95 backdrop-blur-md transition-[max-height,opacity] duration-300 md:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4 sm:px-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-ink transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {link.label}
            </a>
          ))}
          <Button
            href={whatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
            external
            size="md"
            className="mt-2"
            onClick={() => setOpen(false)}
          >
            <WhatsappIcon className="size-4" />
            Solicita tu evaluación gratis
          </Button>
        </nav>
      </div>
    </header>
  );
}
