import { Resend } from "resend";

import { env } from "@/core/lib/env";

export type EmailAttachment = {
  filename: string;
  content: Buffer | Uint8Array;
  contentType?: string;
};

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

export type EmailDriver = {
  enviar: (mensaje: EmailMessage) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;
};

let cached: EmailDriver | null = null;

export function getEmailDriver(): EmailDriver {
  if (cached) return cached;

  const apiKey = env.RESEND_API_KEY;
  const from =
    env.EMAIL_FROM ?? `${env.NEXT_PUBLIC_APP_NAME} <onboarding@resend.dev>`;

  if (!apiKey || env.NODE_ENV === "test") {
    // En test o sin API key, log driver: imprime y simula éxito.
    cached = {
      async enviar(mensaje) {
        const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (env.NODE_ENV !== "test") {
          // No imprimimos contenido binario de attachments al log
          const { attachments, ...resto } = mensaje;
          const meta = attachments?.map((a) => ({
            filename: a.filename,
            bytes: a.content.byteLength,
          }));
          console.info("[email/log]", { id, ...resto, attachments: meta });
        }
        return { ok: true, id };
      },
    };
    return cached;
  }

  const resend = new Resend(apiKey);
  cached = {
    async enviar(mensaje) {
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: mensaje.to,
          subject: mensaje.subject,
          html: mensaje.html,
          text: mensaje.text,
          replyTo: mensaje.replyTo,
          attachments: mensaje.attachments?.map((a) => ({
            filename: a.filename,
            // Resend acepta Buffer directamente
            content: Buffer.isBuffer(a.content)
              ? a.content
              : Buffer.from(a.content),
            contentType: a.contentType,
          })),
        });
        if (error || !data?.id) {
          return { ok: false, error: error?.message ?? "Resend devolvió error desconocido." };
        }
        return { ok: true, id: data.id };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Error de envío.",
        };
      }
    },
  };
  return cached;
}

export async function enviarEmail(mensaje: EmailMessage) {
  return getEmailDriver().enviar(mensaje);
}

/** Solo para tests: limpia el driver cacheado. */
export function _resetEmailDriverCache() {
  cached = null;
}
