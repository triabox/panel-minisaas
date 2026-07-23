"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/ui/sheet";
import { APP_INICIALES, APP_NAME } from "@/core/lib/branding";

import { SidebarNav, type NavGrupo } from "./sidebar";

export function MobileNav({ grupos }: { grupos: NavGrupo[] }) {
  const [open, setOpen] = useState(false);

  // Diferimos el cierre con un microtask para que se ejecute después
  // del click del Link y la navegación de Next ya esté en marcha.
  const cerrarDespuesDeNavegar = () => {
    Promise.resolve().then(() => setOpen(false));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex size-10 items-center justify-center rounded-md text-primary-700 hover:bg-primary-50 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-72 flex-col bg-white p-0 sm:max-w-72"
      >
        <SheetHeader className="shrink-0 border-b border-primary-100 px-6 py-4">
          <SheetTitle className="flex items-center gap-3 text-left">
            <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
              {APP_INICIALES}
            </div>
            <span className="text-sm font-semibold leading-tight text-primary-900">
              {APP_NAME}
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav grupos={grupos} onNavigate={cerrarDespuesDeNavegar} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
