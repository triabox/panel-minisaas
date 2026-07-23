import { notFound } from "next/navigation";

import { auth } from "@/core/auth";
import { tieneRolGestion } from "@/core/permisos";
import { obtenerCapacidad } from "@/modules/capacidad/actions";

import { CapacidadForm } from "./capacidad-form";

export const metadata = { title: "Capacidad" };

export default async function CapacidadPage() {
  const session = await auth();
  if (!tieneRolGestion(session?.user.roles ?? [])) notFound();

  const cap = await obtenerCapacidad();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary-900">
          Capacidad
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu meta fija el techo de horas por cliente. De estas dos cifras sale el
          umbral que marca en rojo a quien se pase.
        </p>
      </header>

      <CapacidadForm
        inicial={{
          horasSoporteMes: cap.horasSoporteMes,
          clientesObjetivo: cap.clientesObjetivo,
        }}
      />
    </div>
  );
}
