import { Toaster } from "@/core/ui/sonner";
import { listarEtiquetasAdmin } from "@/modules/etiquetas/actions";

import { EtiquetasTable } from "./etiquetas-table";
import { NuevaEtiquetaButton } from "./nueva-etiqueta-button";

export const metadata = {
  title: "Etiquetas",
};

export default async function EtiquetasPage() {
  const etiquetas = await listarEtiquetasAdmin();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary-900">
            Etiquetas
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo configurable con el que se clasifican los clientes (ej.:
            potencial, VIP, inactivo).
          </p>
        </div>
        <NuevaEtiquetaButton />
      </header>

      <EtiquetasTable etiquetas={etiquetas} />

      <Toaster richColors closeButton />
    </div>
  );
}
