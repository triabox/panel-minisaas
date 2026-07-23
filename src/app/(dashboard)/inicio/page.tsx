import Link from "next/link";
import { AlertTriangle, Building2, Clock, DollarSign, Gauge, Sparkles } from "lucide-react";

import { auth } from "@/core/auth";
import { prisma } from "@/core/lib/prisma";
import { KpiCard } from "@/core/ui/dashboard/kpi-card";
import { obtenerCapacidad } from "@/modules/capacidad/actions";
import { listarClientes } from "@/modules/clientes/actions";
import { inicioMesActual } from "@/modules/tickets/metricas";

export const metadata = { title: "Salud del negocio" };

export default async function InicioPage() {
  const session = await auth();
  const nombre = session?.user.name?.split(" ")[0] ?? "";

  const desde = inicioMesActual();
  const [clientes, cap, agg, automatizados] = await Promise.all([
    listarClientes(),
    obtenerCapacidad(),
    prisma.ticket.aggregate({
      where: { fecha: { gte: desde } },
      _sum: { horasHombre: true },
      _count: true,
    }),
    prisma.ticket.count({ where: { fecha: { gte: desde }, automatizado: true } }),
  ]);

  const activos = clientes.filter((c) => c.estado === "activo");
  const mrr = activos.reduce((sum, c) => sum + c.abonoMensual, 0);
  const horasMesTotal = agg._sum.horasHombre ?? 0;
  const horasPorCliente = activos.length ? horasMesTotal / activos.length : 0;
  const pctIA = agg._count > 0 ? (automatizados / agg._count) * 100 : 0;
  const capacidadPct = cap.clientesObjetivo
    ? (activos.length / cap.clientesObjetivo) * 100
    : 0;
  const enRiesgo = clientes.filter((c) => c.enRiesgo);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary-900">
          {nombre ? `Hola, ${nombre}` : "Salud del negocio"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tus métricas madre de un vistazo. Datos del mes en curso.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="MRR (clientes activos)"
          valor={`US$ ${mrr.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
          detalle={`${activos.length} cliente${activos.length === 1 ? "" : "s"} activo${activos.length === 1 ? "" : "s"}`}
          icon={DollarSign}
          tono="positivo"
        />
        <KpiCard
          titulo="Capacidad usada"
          valor={`${activos.length} / ${cap.clientesObjetivo}`}
          detalle={`${capacidadPct.toFixed(0)}% de tu meta`}
          icon={Gauge}
        />
        <KpiCard
          titulo="Horas / cliente / mes"
          valor={horasPorCliente.toFixed(1)}
          detalle={`umbral ${cap.umbralHorasCliente.toFixed(1)} h · ${horasMesTotal.toFixed(1)} h totales`}
          icon={Clock}
          tono={horasPorCliente > cap.umbralHorasCliente ? "alerta" : "default"}
        />
        <KpiCard
          titulo="Atendido por IA"
          valor={`${pctIA.toFixed(0)}%`}
          detalle={`${automatizados} de ${agg._count} tickets del mes`}
          icon={Sparkles}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-500" />
          <h2 className="text-lg font-semibold text-primary-900">
            Clientes en riesgo
          </h2>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {enRiesgo.length}
          </span>
        </div>

        {enRiesgo.length === 0 ? (
          <div className="rounded-xl border border-primary-100 bg-white p-6 text-center text-sm text-muted-foreground">
            Ningún cliente en riesgo ahora mismo. 🎉
          </div>
        ) : (
          <div className="divide-y divide-primary-100 overflow-hidden rounded-xl border border-primary-100 bg-white">
            {enRiesgo.map((c) => (
              <Link
                key={c.id}
                href="/clientes"
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-primary-50/50"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="font-medium text-primary-900">
                    {c.negocio}
                  </span>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {c.motivosRiesgo.map((m, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
