import { notFound } from "next/navigation";

import { auth } from "@/core/auth";
import { tieneRolGestion } from "@/core/permisos";
import { listarRubrosAdmin } from "@/modules/rubros/actions";

import { RubrosTable } from "./rubros-table";
import { NuevoRubroButton } from "./nuevo-rubro-button";

export const metadata = { title: "Rubros" };

export default async function RubrosPage() {
  const session = await auth();
  if (!tieneRolGestion(session?.user.roles ?? [])) notFound();

  const rubros = await listarRubrosAdmin();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary-900">
            Rubros
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo configurable con el que clasificás a tus clientes.
          </p>
        </div>
        <NuevoRubroButton />
      </header>

      <RubrosTable rubros={rubros} />
    </div>
  );
}
