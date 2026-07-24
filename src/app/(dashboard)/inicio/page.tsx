import Link from "next/link";
import { AlertTriangle, Building2, Clock, DollarSign, Gauge, Sparkles } from "lucide-react";

import { auth } from "@/core/auth";
import { KpiCard } from "@/core/ui/dashboard/kpi-card";
import { actorDeSesion } from "@/modules/_shared/actor";
import { obtenerSaludNegocio } from "@/modules/metricas/salud";

export const metadata = { title: "Salud del negocio" };

export default async function InicioPage() {
  const session = await auth();
  const nombre = session?.user.name?.split(" ")[0] ?? "";

  const s = await obtenerSaludNegocio(await actorDeSesion());

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
          valor={`US$ ${s.mrr.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
          detalle={`${s.clientesActivos} cliente${s.clientesActivos === 1 ? "" : "s"} activo${s.clientesActivos === 1 ? "" : "s"}`}
          icon={DollarSign}
          tono="positivo"
        />
        <KpiCard
          titulo="Capacidad usada"
          valor={`${s.clientesActivos} / ${s.clientesObjetivo}`}
          detalle={`${s.capacidadPct.toFixed(0)}% de tu meta`}
          icon={Gauge}
        />
        <KpiCard
          titulo="Horas / cliente / mes"
          valor={s.horasPorCliente.toFixed(1)}
          detalle={`umbral ${s.umbralHorasCliente.toFixed(1)} h · ${s.horasMesTotal.toFixed(1)} h totales`}
          icon={Clock}
          tono={s.horasPorCliente > s.umbralHorasCliente ? "alerta" : "default"}
        />
        <KpiCard
          titulo="Atendido por IA"
          valor={`${s.pctIA.toFixed(0)}%`}
          detalle={`${s.ticketsAutomatizadosMes} de ${s.ticketsMes} tickets del mes`}
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
            {s.enRiesgo.length}
          </span>
        </div>

        {s.enRiesgo.length === 0 ? (
          <div className="rounded-xl border border-primary-100 bg-white p-6 text-center text-sm text-muted-foreground">
            Ningún cliente en riesgo ahora mismo. 🎉
          </div>
        ) : (
          <div className="divide-y divide-primary-100 overflow-hidden rounded-xl border border-primary-100 bg-white">
            {s.enRiesgo.map((c) => (
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
                  {c.motivos.map((m, i) => (
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
