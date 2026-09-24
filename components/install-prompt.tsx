"use client";

import { SelloCompacto } from "@/components/marca";

import { useEffect, useState } from "react";
import { IconX } from "./icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const KEY = "lrd:install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/** Dismissible "install this app" banner driven by the PWA beforeinstallprompt
 *  event. Only appears where the browser supports installation. */
export default function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  /*
    Mientras la oferta está en pantalla, la esquina inferior derecha es suya:
    el botón de «volver arriba» vive exactamente ahí y quedaba tapado debajo
    (z-40 contra z-60). Se marca en el `html` y `globals.css` aparta el botón;
    al descartar, vuelve. Son dos afordancias flotantes en el mismo sitio, y
    solo una puede estar a la vez.
  */
  useEffect(() => {
    const raiz = document.documentElement;
    if (show) raiz.dataset.ofertaInstalar = "1";
    else delete raiz.dataset.ofertaInstalar;
    return () => {
      delete raiz.dataset.ofertaInstalar;
    };
  }, [show]);

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(KEY, "1");
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    try {
      await evt.userChoice;
    } catch {
      /* ignore */
    }
    dismiss();
  };

  /*
    El desplazamiento inferior existe para librar la tab bar móvil (4.5rem más
    el área segura, la misma que el `body` se reserva de relleno). En escritorio
    esa barra es `lg:hidden`, y la regla se quedaba a medias: se sobrescribía la
    posición horizontal (`lg:inset-x-auto lg:right-4`) pero no la vertical, así
    que el aviso seguía flotando 84 px por encima del borde para esquivar algo
    que no está — y se plantaba encima de las cifras de deuda del panorama en
    vez de quedarse en su esquina. `lg:bottom-4` lo empareja con `lg:right-4`:
    en escritorio es una esquina, no una banda a media altura.
  */
  return (
    <Card
      role="complementary"
      aria-label="Instalar la aplicación"
      /*
        Tercera pieza en la misma esquina. La ficha de un proceso marca la raíz
        con `data-barra-acciones` mientras su barra fija está montada —seguir,
        compartir, ofertar, de 72 a 145 px sobre el borde— y este aviso sube por
        encima de ella, con el mismo desplazamiento que `globals.css` aplica al
        botón de «volver arriba». Se lee de la raíz y no de la ruta: el mecanismo
        es el atributo, y así solo hay un camino. Solo por debajo de `lg`, que es
        donde esa barra se pinta.
      */
      className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[60] p-3.5 shadow-card max-lg:[[data-barra-acciones]_&]:bottom-[calc(10.25rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:bottom-4 lg:right-4 lg:max-w-sm"
    >
      <div className="flex items-center gap-3">
        <SelloCompacto className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Instala Socrático</p>
          <p className="text-xs text-ink-soft">
            Acceso directo, a pantalla completa, desde tu inicio.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={dismiss}
          className="shrink-0 text-ink-soft"
        >
          <IconX className="h-4 w-4" />
          <span className="sr-only">Descartar</span>
        </Button>
      </div>
      <Button onClick={install} className="mt-3 w-full">
        Añadir al inicio
      </Button>
    </Card>
  );
}
