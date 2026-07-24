import Link from "next/link";
import { BellRing } from "lucide-react";

import { auth } from "@/core/auth";
import { tieneRolGestion } from "@/core/permisos";
import { fmtFecha } from "@/core/lib/fechas";
import { actorDeSesion } from "@/modules/_shared/actor";
import {
  listarProspectosConActor,
  recordatoriosPendientes,
} from "@/modules/prospectos/service";
import { listarRubrosActivos } from "@/modules/rubros/actions";

import { PipelineMap } from "./pipeline-map";
import { ProspectosTable } from "./prospectos-table";
import { NuevoProspectoButton } from "./nuevo-prospecto-button";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const session = await auth();
  const roles = session?.user.roles ?? [];
  const actor = await actorDeSesion();

  const [prospectos, recordatorios, rubros] = await Promise.all([
    listarProspectosConActor(actor),
    recordatoriosPendientes(actor),
    listarRubrosActivos(),
  ]);

  const pins = prospectos
    .filter((p) => p.latitud != null && p.longitud != null)
    .map((p) => ({
      id: p.id,
      negocio: p.negocio,
      estado: p.estado,
      rubro: p.rubro,
      latitud: p.latitud as number,
      longitud: p.longitud as number,
    }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary-900">
            Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">
            De contactado a cerrado. Las horas por estado suman tu CAC. Cargá la
            dirección y el mapa los ubica solo.
          </p>
        </div>
        <NuevoProspectoButton rubros={rubros} />
      </header>

      {recordatorios.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <BellRing className="size-4" />
            Recordatorios de seguimiento ({recordatorios.length})
          </div>
          <ul className="flex flex-wrap gap-2">
            {recordatorios.map((r) => (
              <li key={r.id}>
                <Link
                  href="/pipeline"
                  className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs text-amber-800"
                >
                  <span className="font-medium">{r.negocio}</span>
                  <span className="text-amber-600">
                    · {r.fechaRecordatorio ? fmtFecha(r.fechaRecordatorio) : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <PipelineMap pins={pins} />

      <ProspectosTable
        prospectos={prospectos}
        rubros={rubros}
        esGestion={tieneRolGestion(roles)}
      />
    </div>
  );
}
