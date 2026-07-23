/**
 * Helpers de RBAC del núcleo. Roles del sistema (sembrados por prisma/seed.ts):
 *
 *  - super_admin  → acceso total (incluye auditoría y gestión de usuarios).
 *  - admin        → gestión completa del negocio, sin super-poderes de sistema.
 *  - operador     → carga y edición del día a día, sin configuración.
 *  - observador   → solo lectura.
 *
 * Los sistemas hijos pueden agregar roles propios en su seed y helpers propios
 * en src/modules/ — este archivo es zona core (no editarlo en los hijos).
 */

const ROLES_GESTION = new Set(["super_admin", "admin"]);
const ROLES_OPERACION = new Set(["super_admin", "admin", "operador"]);

/** Puede administrar el negocio: configuración, catálogos, altas y bajas. */
export function tieneRolGestion(roles: string[]): boolean {
  return roles.some((r) => ROLES_GESTION.has(r));
}

/** Puede operar el día a día (cargar/editar datos), además de la gestión. */
export function puedeOperar(roles: string[]): boolean {
  return roles.some((r) => ROLES_OPERACION.has(r));
}

/** Solo lectura ampliada (reportes/consultas); incluye a super_admin. */
export function esObservador(roles: string[]): boolean {
  return roles.includes("observador") || roles.includes("super_admin");
}

/** Poderes de sistema: auditoría, usuarios, acciones irreversibles. */
export function esSuperAdmin(roles: string[]): boolean {
  return roles.includes("super_admin");
}
