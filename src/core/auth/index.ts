import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/core/lib/prisma";
import { ipDelRequest, permitirIntento } from "@/core/lib/rate-limit";
import { validarUsuarioVigente } from "./vigencia";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const MAX_INTENTOS_FALLIDOS = 5;
const BLOQUEO_MINUTOS = 15;

// Rate limit de login por IP (además del bloqueo por cuenta): frena el
// credential stuffing que prueba muchos emails desde el mismo origen.
const LOGIN_MAX_POR_IP = 20;
const LOGIN_VENTANA_SEGUNDOS = 10 * 60;

// Cada cuánto re-verificamos contra la DB que la cuenta siga activa y con
// qué roles (revocación efectiva sin esperar a que venza el JWT de 12 h).
const REVALIDAR_SESION_MS = 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 }, // 12 horas
  pages: {
    signIn: "/ingresar",
  },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(creds) {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;

        const ip = await ipDelRequest();
        const permitido = await permitirIntento(
          `login:ip:${ip}`,
          LOGIN_MAX_POR_IP,
          LOGIN_VENTANA_SEGUNDOS,
        );
        if (!permitido) return null;

        const { email, password } = parsed.data;
        const usuario = await prisma.usuario.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            persona: { select: { nombre: true, apellido: true } },
            roles: { include: { rol: true } },
          },
        });

        if (!usuario || !usuario.activo) return null;

        if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
          return null;
        }

        const valida = await bcrypt.compare(password, usuario.passwordHash);

        if (!valida) {
          const nuevosIntentos = usuario.intentosFallidos + 1;
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
              intentosFallidos: nuevosIntentos,
              bloqueadoHasta:
                nuevosIntentos >= MAX_INTENTOS_FALLIDOS
                  ? new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000)
                  : null,
            },
          });
          return null;
        }

        // Login OK — resetear intentos y registrar último acceso
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            intentosFallidos: 0,
            bloqueadoHasta: null,
            ultimoLogin: new Date(),
          },
        });

        return {
          id: usuario.id,
          email: usuario.email,
          name: `${usuario.persona.nombre} ${usuario.persona.apellido}`,
          roles: usuario.roles.map((ur) => ur.rol.codigo),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as { roles?: string[] }).roles ?? [];
        token.validadoEn = Date.now();
        return token;
      }

      // Revalidación periódica: si la cuenta fue desactivada o bloqueada,
      // devolver null mata la sesión; si cambiaron los roles, se refrescan.
      const validadoEn = token.validadoEn ?? 0;
      if (token.id && Date.now() - validadoEn > REVALIDAR_SESION_MS) {
        const vigente = await validarUsuarioVigente(token.id);
        if (!vigente) return null;
        token.roles = vigente.roles;
        token.validadoEn = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as string[]) ?? [];
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession["user"];
  }

  interface User {
    roles?: string[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    roles?: string[];
    /** Última verificación de vigencia de la cuenta contra la DB (ms epoch). */
    validadoEn?: number;
  }
}
