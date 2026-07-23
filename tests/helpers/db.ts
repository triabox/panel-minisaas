import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@/generated/prisma/client";

let cachedPrisma: PrismaClient | null = null;

export function getTestPrisma(): PrismaClient {
  if (cachedPrisma) return cachedPrisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !connectionString.includes("test")) {
    throw new Error(
      "getTestPrisma() solo puede usarse con DATABASE_URL apuntando a una DB de test.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  cachedPrisma = new PrismaClient({ adapter });
  return cachedPrisma;
}

/**
 * Trunca todas las tablas de la app dejando la DB en estado limpio.
 * Mantiene el schema y los enums (no toca migraciones).
 */
export async function resetTestDb() {
  const prisma = getTestPrisma();

  // Agregá acá cada tabla nueva de tu dominio (si te olvidás, el test lo avisa).
  const tablas = [
    "RateLimit",
    "Ticket",
    "Cliente",
    "Rubro",
    "ConfiguracionCapacidad",
    "Documento",
    "PasswordResetToken",
    "AuditLog",
    "UsuarioRol",
    "RolPermiso",
    "Permiso",
    "Rol",
    "Usuario",
    "Persona",
  ];

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tablas.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
}

/**
 * Siembra datos mínimos para integ tests. ASUME que la DB ya fue truncada
 * (caller debe llamar resetTestDb() antes).
 *
 * Crea: 1 rol super_admin, 1 persona y 1 usuario con el rol asignado.
 * Todo dentro de una transacción para garantizar consistencia FK.
 */
export async function seedTestEssentials() {
  const prisma = getTestPrisma();
  const passwordHash = await bcrypt.hash("test-password-1234", 10);

  return prisma.$transaction(async (tx) => {
    const rol = await tx.rol.create({
      data: {
        codigo: "super_admin",
        nombre: "Súper administración",
        esSistema: true,
      },
    });

    // Crear usuario con persona anidada en una sola operación atómica.
    const usuario = await tx.usuario.create({
      data: {
        email: "test-admin@misistema.local",
        passwordHash,
        emailVerificado: true,
        activo: true,
        persona: {
          create: {
            nombre: "Test",
            apellido: "Admin",
            documento: "00000001",
            email: "test-admin@misistema.local",
          },
        },
      },
      include: { persona: true },
    });

    await tx.usuarioRol.create({
      data: { usuarioId: usuario.id, rolId: rol.id },
    });

    return { persona: usuario.persona, usuario, rol };
  });
}

export const TEST_USUARIO = {
  email: "test-admin@misistema.local",
  password: "test-password-1234",
};
