import Link from "next/link";
import { CalendarClock, Sparkles } from "lucide-react";

import { auth } from "@/core/auth";
import { tieneRolGestion } from "@/core/permisos";
import { fmtFecha } from "@/core/lib/fechas";
import { actorDeSesion } from "@/modules/_shared/actor";
import { listarMejorasConActor, obtenerRoadmap } from "@/modules/mejoras/service";

import { MejorasTable } from "./mejoras-table";
import { NuevaMejoraButton } from "./nueva-mejora-button";

export const metadata = { title: "Roadmap de mejoras" };

export default async function RoadmapPage() {
  const session = await auth();
  const roles = session?.user.roles ?? [];
  const actor = await actorDeSesion();

  const [roadmap, mejoras] = await Promise.all([
    obtenerRoadmap(actor),
    listarMejorasConActor(actor),
  ]);
  const lesToca = roadmap.filter((r) => r.leToca);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary-900">
            Roadmap de mejoras
          </h1>
          <p className="text-sm text-muted-foreground">
            Hace cumplir tu regla de scope: 1ª mejora tras el primer pago, luego
            una cada tanto (se estira si el cliente consume mucho soporte).
          </p>
        </div>
        <NuevaMejoraButton />
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-teal-600" />
          <h2 className="text-lg font-semibold text-primary-900">
            Les toca mejora este mes
          </h2>
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
            {lesToca.length}
          </span>
        </div>

        {lesToca.length === 0 ? (
          <div className="rounded-xl border border-primary-100 bg-white p-6 text-center text-sm text-muted-foreground">
            Nadie está esperando una mejora ahora mismo. Buen trabajo. 🎉
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lesToca.map((r) => (
              <Link
                key={r.clienteId}
                href="/clientes"
                className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 transition-colors hover:border-teal-300"
              >
                <p className="font-semibold text-primary-900">{r.negocio}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="size-3" />
                  {r.entregadas === 0
                    ? "Nunca le entregaste una mejora"
                    : `Hace ${r.diasSinEntrega} días sin entregar (${r.entregadas} entregadas)`}
                </p>
                {r.excedeHoras ? (
                  <p className="mt-2 inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                    Consume muchas horas — considerá estirarla
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary-900">
          Todas las mejoras
        </h2>
        <MejorasTable mejoras={mejoras} esGestion={tieneRolGestion(roles)} />
      </section>
    </div>
  );
}
