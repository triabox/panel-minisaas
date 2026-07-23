import { Tags, UserCheck, Users } from "lucide-react";

import { auth } from "@/core/auth";
import { prisma } from "@/core/lib/prisma";
import { KpiCard } from "@/core/ui/dashboard/kpi-card";

export const metadata = { title: "Inicio" };

/**
 * Página de inicio de ejemplo: un par de KPIs reales del dominio demo.
 * Reemplazala por el tablero de tu sistema.
 */
export default async function InicioPage() {
  const session = await auth();

  const [clientes, clientesActivos, etiquetas] = await Promise.all([
    prisma.cliente.count(),
    prisma.cliente.count({ where: { activo: true } }),
    prisma.etiqueta.count({ where: { activo: true } }),
  ]);

  const nombre = session?.user.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary-900">
          {nombre ? `Hola, ${nombre}` : "Inicio"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del sistema.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard titulo="Clientes" valor={clientes} icon={Users} />
        <KpiCard
          titulo="Clientes activos"
          valor={clientesActivos}
          icon={UserCheck}
          tono="positivo"
        />
        <KpiCard titulo="Etiquetas activas" valor={etiquetas} icon={Tags} />
      </div>
    </div>
  );
}
