/**
 * Servidor MCP del panel (transporte HTTP en /api/mcp).
 *
 * Expone las funcionalidades como herramientas para que una IA opere el panel:
 * consultar salud/riesgo/clientes, cargar horas, mover prospectos, descubrir y
 * cargar prospectos, y ver a quién le toca mejora. Autenticación por token
 * (env `MCP_TOKEN`); todas las operaciones corren como actor de sistema.
 */
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { prisma } from "@/core/lib/prisma";
import { ACTOR_SISTEMA } from "@/modules/_shared/actor";
import { listarClientesConActor, buscarClientesConActor } from "@/modules/clientes/service";
import { obtenerSaludNegocio } from "@/modules/metricas/salud";
import { crearTicketCore } from "@/modules/tickets/service";
import { obtenerRoadmap, marcarMejoraEntregadaCore } from "@/modules/mejoras/service";
import {
  crearProspectoCore,
  listarProspectosConActor,
  moverProspectoCore,
} from "@/modules/prospectos/service";

function texto(data: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data, null, 2) },
    ],
  };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "salud_del_negocio",
      {
        description:
          "Métricas madre del mes: MRR, capacidad usada, horas/cliente/mes, % IA y clientes en riesgo.",
        inputSchema: {},
      },
      async () => texto(await obtenerSaludNegocio(ACTOR_SISTEMA)),
    );

    server.registerTool(
      "clientes_en_riesgo",
      {
        description:
          "Lista los clientes en riesgo con el motivo (pago demorado/vencido o exceso de horas).",
        inputSchema: {},
      },
      async () => {
        const enRiesgo = (await listarClientesConActor(ACTOR_SISTEMA)).filter(
          (c) => c.enRiesgo,
        );
        return texto(
          enRiesgo.map((c) => ({
            negocio: c.negocio,
            motivos: c.motivosRiesgo,
            horasMes: c.horasMes,
          })),
        );
      },
    );

    server.registerTool(
      "buscar_clientes",
      {
        description:
          "Busca clientes por nombre del negocio. Devuelve id + nombre (usá el id para cargar horas).",
        inputSchema: { query: z.string().describe("Texto a buscar") },
      },
      async ({ query }) =>
        texto(await buscarClientesConActor(ACTOR_SISTEMA, query)),
    );

    server.registerTool(
      "cargar_horas",
      {
        description:
          "Registra un ticket de soporte con sus horas. Primero usá buscar_clientes para obtener el clienteId.",
        inputSchema: {
          clienteId: z.string(),
          tipo: z.enum(["bug", "ajuste", "feature", "consulta"]),
          horasHombre: z.number().min(0),
          tiempoIa: z.number().min(0).default(0),
          automatizado: z.boolean().default(false),
          descripcion: z.string().optional(),
        },
      },
      async (args) => texto(await crearTicketCore(ACTOR_SISTEMA, args)),
    );

    server.registerTool(
      "listar_pipeline",
      {
        description: "Lista los prospectos del pipeline con su estado y CAC (horas).",
        inputSchema: {},
      },
      async () => texto(await listarProspectosConActor(ACTOR_SISTEMA)),
    );

    server.registerTool(
      "crear_prospecto",
      {
        description:
          "Carga un prospecto en el pipeline. Si pasás una dirección, se geolocaliza y aparece en el mapa. Ideal para que una IA cargue prospectos que descubrió.",
        inputSchema: {
          negocio: z.string(),
          rubro: z.string().optional().describe("Nombre del rubro (opcional)"),
          direccion: z.string().optional(),
          contactoNombre: z.string().optional(),
          contactoEmail: z.string().optional(),
          contactoTelefono: z.string().optional(),
          notas: z.string().optional(),
        },
      },
      async ({ rubro, ...resto }) => {
        let rubroId: string | undefined;
        if (rubro) {
          const r = await prisma.rubro.findFirst({
            where: { nombre: { contains: rubro, mode: "insensitive" } },
            select: { id: true },
          });
          rubroId = r?.id;
        }
        return texto(
          await crearProspectoCore(ACTOR_SISTEMA, {
            ...resto,
            rubroId,
            origen: "mcp",
          }),
        );
      },
    );

    server.registerTool(
      "mover_prospecto",
      {
        description:
          "Mueve un prospecto de estado registrando las horas invertidas (suman al CAC).",
        inputSchema: {
          prospectoId: z.string(),
          estado: z.enum(["contactado", "demo", "prueba", "cerrado", "descartado"]),
          horas: z.number().min(0).default(0),
        },
      },
      async ({ prospectoId, estado, horas }) =>
        texto(await moverProspectoCore(ACTOR_SISTEMA, prospectoId, { estado, horas })),
    );

    server.registerTool(
      "mejoras_pendientes",
      {
        description:
          "Clientes a los que les toca una mejora este mes (según el roadmap).",
        inputSchema: {},
      },
      async () => {
        const roadmap = (await obtenerRoadmap(ACTOR_SISTEMA)).filter(
          (r) => r.leToca,
        );
        return texto(
          roadmap.map((r) => ({
            negocio: r.negocio,
            entregadas: r.entregadas,
            diasSinEntrega: r.diasSinEntrega,
          })),
        );
      },
    );

    server.registerTool(
      "marcar_mejora_entregada",
      {
        description: "Marca una mejora como entregada.",
        inputSchema: { mejoraId: z.string() },
      },
      async ({ mejoraId }) =>
        texto(await marcarMejoraEntregadaCore(ACTOR_SISTEMA, mejoraId)),
    );
  },
  {},
  { basePath: "/api" },
);

/** Auth por token: `Authorization: Bearer <MCP_TOKEN>`. */
async function guarded(req: Request): Promise<Response> {
  const expected = process.env.MCP_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "MCP deshabilitado (falta MCP_TOKEN)." },
      { status: 503 },
    );
  }
  const token = (req.headers.get("authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (token !== expected) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  return handler(req);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
