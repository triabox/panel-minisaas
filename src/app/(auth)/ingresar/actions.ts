"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/core/auth";
import { AUDIT_MODULOS, registrarAuditoria } from "@/core/lib/audit";
import { prisma } from "@/core/lib/prisma";

type Result =
  | { ok: true }
  | { ok: false; error: string };

export async function iniciarSesion(input: {
  email: string;
  password: string;
}): Promise<Result> {
  const email = input.email.trim().toLowerCase();
  try {
    await signIn("credentials", {
      email,
      password: input.password,
      redirect: false,
    });
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });
    await registrarAuditoria({
      modulo: AUDIT_MODULOS.AUTH,
      accion: "login",
      recursoTipo: "Usuario",
      recursoId: usuario?.id,
      usuarioId: usuario?.id ?? null,
      detalle: `Inicio de sesión exitoso para ${email}`,
    });
    return { ok: true };
  } catch (error) {
    await registrarAuditoria({
      modulo: AUDIT_MODULOS.AUTH,
      accion: "login_fallido",
      recursoTipo: "Usuario",
      exito: false,
      detalle: `Intento fallido para ${email}`,
    });
    if (error instanceof AuthError) {
      return {
        ok: false,
        error:
          "Email o contraseña incorrectos. Si seguís sin poder ingresar, comunicate con la administración.",
      };
    }
    return {
      ok: false,
      error:
        "No pudimos procesar tu ingreso. Intentá de nuevo en un momento.",
    };
  }
}
