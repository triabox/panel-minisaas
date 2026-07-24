import { auth } from "@/core/auth";

/**
 * "Actor" = quién ejecuta una operación de dominio. Permite que la MISMA lógica
 * de negocio la usen dos entradas distintas:
 *  - la UI (server actions) con el actor derivado de la sesión NextAuth, y
 *  - la capa MCP (`/api/mcp`) con un actor de sistema (sin sesión, por token).
 *
 * Las funciones `*Core`/`*ConActor` de cada módulo viven en `service.ts`
 * (NO "use server"): no se exponen al cliente, así que reciben el actor sin
 * riesgo de escalar privilegios. Los archivos `actions.ts` ("use server")
 * envuelven esa lógica con el actor de sesión.
 */
export type Actor = {
  usuarioId: string | null;
  roles: string[];
};

/** Actor de sistema para la capa MCP: opera como super_admin, sin sesión. */
export const ACTOR_SISTEMA: Actor = { usuarioId: null, roles: ["super_admin"] };

/** Actor de la sesión actual (UI). `null` si no hay sesión iniciada. */
export async function actorDeSesion(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user) return null;
  return { usuarioId: session.user.id, roles: session.user.roles };
}
