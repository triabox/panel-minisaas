"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { auth } from "@/core/auth";
import { aplanarErrores, type ActionResult } from "@/core/lib/action-result";
import { AUDIT_MODULOS, registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";
import {
  resetPasswordSchema,
  usuarioEditarSchema,
  usuarioInputSchema,
} from "./schemas";

async function exigirSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!session.user.roles.includes("super_admin")) {
    throw new Error("Solo super admin puede gestionar usuarios.");
  }
  return session.user;
}

export async function listarUsuarios() {
  const session = await auth();
  if (!session?.user?.roles.includes("super_admin")) {
    return [] as Array<{
      id: string;
      email: string;
      nombre: string;
      apellido: string;
      activo: boolean;
      ultimoLogin: Date | null;
      bloqueadoHasta: Date | null;
      roles: Array<{ codigo: string; nombre: string }>;
    }>;
  }

  const usuarios = await prisma.usuario.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      persona: { select: { nombre: true, apellido: true } },
      roles: { include: { rol: { select: { codigo: true, nombre: true } } } },
    },
  });

  return usuarios.map((u) => ({
    id: u.id,
    email: u.email,
    nombre: u.persona.nombre,
    apellido: u.persona.apellido,
    activo: u.activo,
    ultimoLogin: u.ultimoLogin,
    bloqueadoHasta: u.bloqueadoHasta,
    roles: u.roles.map((r) => ({
      codigo: r.rol.codigo,
      nombre: r.rol.nombre,
    })),
  }));
}

export async function listarRolesDisponibles() {
  const session = await auth();
  if (!session?.user?.roles.includes("super_admin")) return [];
  return prisma.rol.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, codigo: true, nombre: true, descripcion: true },
  });
}

export async function crearUsuario(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await exigirSuperAdmin();

  const parsed = usuarioInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos: aplanarErrores(parsed.error),
    };
  }

  const { email, documento, password, rolesCodigos, ...resto } = parsed.data;

  const conflictoEmail = await prisma.usuario.findUnique({ where: { email } });
  if (conflictoEmail) {
    return {
      ok: false,
      error: "Ya existe un usuario con ese email.",
      campos: { email: "Email ya registrado." },
    };
  }
  if (documento) {
    const conflictoDoc = await prisma.persona.findUnique({
      where: { documento },
    });
    if (conflictoDoc) {
      return {
        ok: false,
        error: "Ya existe una persona con ese documento.",
        campos: { documento: "Documento ya registrado." },
      };
    }
  }

  const roles = await prisma.rol.findMany({
    where: { codigo: { in: rolesCodigos } },
  });
  if (roles.length !== rolesCodigos.length) {
    return { ok: false, error: "Alguno de los roles seleccionados no existe." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuario = await prisma.$transaction(async (tx) => {
    const u = await tx.usuario.create({
      data: {
        email,
        passwordHash,
        emailVerificado: true,
        activo: true,
        persona: {
          create: {
            nombre: resto.nombre,
            apellido: resto.apellido,
            documento: documento ?? null,
            email,
          },
        },
      },
    });
    for (const rol of roles) {
      await tx.usuarioRol.create({
        data: { usuarioId: u.id, rolId: rol.id },
      });
    }
    return u;
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULOS.USUARIOS,
    accion: "crear",
    recursoTipo: "Usuario",
    recursoId: usuario.id,
    valorNuevo: { email, roles: rolesCodigos },
    detalle: `${resto.apellido}, ${resto.nombre}`,
  });

  revalidatePath("/usuarios");
  return { ok: true, data: { id: usuario.id } };
}

export async function actualizarUsuario(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await exigirSuperAdmin();
  if (!id) return { ok: false, error: "Falta el id." };

  const parsed = usuarioEditarSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los datos del formulario.",
      campos: aplanarErrores(parsed.error),
    };
  }
  const { email, documento, rolesCodigos, ...resto } = parsed.data;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { roles: true },
  });
  if (!usuario) return { ok: false, error: "Usuario no encontrado." };

  const conflicto = await prisma.usuario.findFirst({
    where: { email, NOT: { id } },
  });
  if (conflicto) {
    return {
      ok: false,
      error: "Ya existe otro usuario con ese email.",
      campos: { email: "Email ya registrado." },
    };
  }

  const roles = await prisma.rol.findMany({
    where: { codigo: { in: rolesCodigos } },
  });
  if (roles.length !== rolesCodigos.length) {
    return { ok: false, error: "Alguno de los roles seleccionados no existe." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id },
      data: {
        email,
        persona: {
          update: {
            nombre: resto.nombre,
            apellido: resto.apellido,
            documento: documento ?? null,
            email,
          },
        },
      },
    });
    await tx.usuarioRol.deleteMany({ where: { usuarioId: id } });
    for (const rol of roles) {
      await tx.usuarioRol.create({ data: { usuarioId: id, rolId: rol.id } });
    }
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULOS.USUARIOS,
    accion: "actualizar",
    recursoTipo: "Usuario",
    recursoId: id,
    valorNuevo: { email, roles: rolesCodigos },
  });

  revalidatePath("/usuarios");
  return { ok: true, data: undefined };
}

export async function toggleUsuarioActivo(
  id: string,
): Promise<ActionResult<{ activo: boolean }>> {
  const actor = await exigirSuperAdmin();
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { roles: { include: { rol: true } } },
  });
  if (!usuario) return { ok: false, error: "Usuario no encontrado." };

  if (usuario.id === actor.id) {
    return { ok: false, error: "No podés desactivar tu propia cuenta." };
  }

  // Si es la única cuenta super_admin activa, no se puede desactivar.
  if (
    usuario.activo &&
    usuario.roles.some((r) => r.rol.codigo === "super_admin")
  ) {
    const otrasActivas = await prisma.usuario.count({
      where: {
        id: { not: id },
        activo: true,
        roles: { some: { rol: { codigo: "super_admin" } } },
      },
    });
    if (otrasActivas === 0) {
      return {
        ok: false,
        error:
          "No se puede desactivar la única cuenta super admin activa. Asigná otra primero.",
      };
    }
  }

  const actualizado = await prisma.usuario.update({
    where: { id },
    data: { activo: !usuario.activo },
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULOS.USUARIOS,
    accion: actualizado.activo ? "activar" : "desactivar",
    recursoTipo: "Usuario",
    recursoId: id,
    detalle: usuario.email,
  });

  revalidatePath("/usuarios");
  return { ok: true, data: { activo: actualizado.activo } };
}

export async function desbloquearUsuario(id: string): Promise<ActionResult> {
  await exigirSuperAdmin();
  await prisma.usuario.update({
    where: { id },
    data: { intentosFallidos: 0, bloqueadoHasta: null },
  });
  revalidatePath("/usuarios");
  return { ok: true, data: undefined };
}

export async function resetearPasswordUsuario(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await exigirSuperAdmin();
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Contraseña inválida.",
      campos: aplanarErrores(parsed.error),
    };
  }
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) return { ok: false, error: "Usuario no encontrado." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.usuario.update({
    where: { id },
    data: { passwordHash, intentosFallidos: 0, bloqueadoHasta: null },
  });

  await registrarAuditoria({
    modulo: AUDIT_MODULOS.USUARIOS,
    accion: "reset_password",
    recursoTipo: "Usuario",
    recursoId: id,
    detalle: `Reset por super admin para ${usuario.email}`,
  });

  return { ok: true, data: undefined };
}
