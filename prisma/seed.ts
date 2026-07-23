/**
 * Seed del núcleo — idempotente (se puede correr N veces).
 *
 * Siembra: roles del sistema, permisos core, admin inicial (desde
 * BOOTSTRAP_ADMIN_*) y el catálogo de ejemplo (Etiqueta).
 *
 * Los sistemas hijos agregan SUS catálogos/permisos al final de este
 * archivo (zona marcada), sin tocar la sección core.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Falta DATABASE_URL");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// --- Admin inicial (cambiá la contraseña después del primer ingreso) ---
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@misistema.local";
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "cambiar123";
const ADMIN_NOMBRE = process.env.BOOTSTRAP_ADMIN_NOMBRE ?? "Admin";
const ADMIN_APELLIDO = process.env.BOOTSTRAP_ADMIN_APELLIDO ?? "Inicial";

// ========================================================
// CORE — roles y permisos (zona parcheable, no editar en hijos)
// ========================================================

const ROLES_SISTEMA = [
  {
    codigo: "super_admin",
    nombre: "Súper administración",
    descripcion: "Acceso total: usuarios, auditoría y configuración del sistema.",
  },
  {
    codigo: "admin",
    nombre: "Administración",
    descripcion: "Gestión completa del negocio: catálogos, altas y bajas.",
  },
  {
    codigo: "operador",
    nombre: "Operación",
    descripcion: "Carga y edición del día a día, sin configuración.",
  },
  {
    codigo: "observador",
    nombre: "Observación",
    descripcion: "Solo lectura de datos y reportes.",
  },
];

// Formato: [modulo, recurso, accion]
const PERMISOS_CORE = [
  ["core", "usuario", "ver"],
  ["core", "usuario", "crear"],
  ["core", "usuario", "editar"],
  ["core", "usuario", "desactivar"],
  ["core", "persona", "ver"],
  ["core", "persona", "crear"],
  ["core", "persona", "editar"],
  ["core", "persona", "anonimizar"],
  ["core", "documento", "ver"],
  ["core", "documento", "subir"],
  ["core", "documento", "eliminar"],
  ["core", "auditoria", "ver"],
] as const;

// ========================================================
// EJEMPLO — catálogo demo (borrá/renombrá con tu dominio)
// ========================================================

const ETIQUETAS_DEMO = [
  { codigo: "potencial", nombre: "Potencial", orden: 10 },
  { codigo: "activo", nombre: "Activo", orden: 20 },
  { codigo: "vip", nombre: "VIP", orden: 30 },
  { codigo: "inactivo", nombre: "Inactivo", orden: 90 },
];

async function main() {
  console.log("🌱 Seed del núcleo...");

  // Roles
  for (const rol of ROLES_SISTEMA) {
    await prisma.rol.upsert({
      where: { codigo: rol.codigo },
      update: { nombre: rol.nombre, descripcion: rol.descripcion },
      create: { ...rol, esSistema: true },
    });
  }
  console.log(`  ✓ Roles: ${ROLES_SISTEMA.length}`);

  // Permisos core
  for (const [modulo, recurso, accion] of PERMISOS_CORE) {
    await prisma.permiso.upsert({
      where: { modulo_recurso_accion: { modulo, recurso, accion } },
      update: {},
      create: { modulo, recurso, accion },
    });
  }
  console.log(`  ✓ Permisos core: ${PERMISOS_CORE.length}`);

  // super_admin recibe todos los permisos
  const superAdmin = await prisma.rol.findUniqueOrThrow({
    where: { codigo: "super_admin" },
  });
  const permisos = await prisma.permiso.findMany({ select: { id: true } });
  for (const p of permisos) {
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: superAdmin.id, permisoId: p.id } },
      update: {},
      create: { rolId: superAdmin.id, permisoId: p.id, scope: "GLOBAL" },
    });
  }
  console.log(`  ✓ super_admin ← ${permisos.length} permisos`);

  // Admin inicial (Persona + Usuario + rol)
  const existente = await prisma.usuario.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase() },
  });
  if (!existente) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const usuario = await prisma.usuario.create({
      data: {
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        emailVerificado: true,
        activo: true,
        persona: {
          create: {
            nombre: ADMIN_NOMBRE,
            apellido: ADMIN_APELLIDO,
            email: ADMIN_EMAIL.toLowerCase(),
          },
        },
      },
    });
    await prisma.usuarioRol.create({
      data: { usuarioId: usuario.id, rolId: superAdmin.id },
    });
    console.log(`  ✓ Admin inicial: ${ADMIN_EMAIL}`);
    if (ADMIN_PASSWORD === "cambiar123") {
      console.warn(
        "  ⚠️  El admin quedó con la contraseña por defecto — cambiala tras el primer ingreso.",
      );
    }
  } else {
    console.log(`  ✓ Admin ya existe: ${ADMIN_EMAIL}`);
  }

  // ========================================================
  // EJEMPLO (zona custom de los hijos a partir de acá)
  // ========================================================
  for (const e of ETIQUETAS_DEMO) {
    await prisma.etiqueta.upsert({
      where: { codigo: e.codigo },
      update: {},
      create: e,
    });
  }
  console.log(`  ✓ Etiquetas demo: ${ETIQUETAS_DEMO.length}`);

  console.log("✅ Seed completo.");
}

main()
  .catch((e) => {
    console.error("Seed falló:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
