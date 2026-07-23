import { BRAND_COLOR } from "@/core/lib/branding";
import { env } from "@/core/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const INSTITUCION = env.NEXT_PUBLIC_INSTITUCION_NOMBRE;

/**
 * Layout base de todos los emails del sistema. Los módulos de dominio de cada
 * sistema hijo definen sus propias plantillas en src/modules/ reutilizando
 * este layout (exportado a propósito).
 */
export function layoutEmail(opciones: {
  titulo: string;
  cuerpo: string;
  saludo?: string;
}) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapar(opciones.titulo)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2430;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:14px;border:1px solid #e3e6f0;overflow:hidden;">
          <tr>
            <td style="background:${BRAND_COLOR};padding:18px 24px;color:#fff;font-weight:600;font-size:18px;">
              ${escapar(APP_NAME)}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              ${opciones.saludo ? `<p style="margin:0 0 12px;">${escapar(opciones.saludo)}</p>` : ""}
              ${opciones.cuerpo}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;background:#f1f2f8;color:#5d6478;font-size:12px;line-height:1.4;">
              Este mensaje fue enviado por ${escapar(APP_NAME)} – ${escapar(INSTITUCION)}.<br/>
              Si no esperabas este mail, ignoralo o respondé para que dejemos de enviarte.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapar(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plantilla: recupero de contraseña. */
export function plantillaRecuperoContrasena(input: {
  nombrePersona: string;
  enlace: string;
  vencimientoMinutos: number;
}) {
  const cuerpo = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">
      Recibimos una solicitud para restablecer tu contraseña.
    </p>
    <p style="margin:0 0 16px;">
      <a href="${escapar(input.enlace)}"
         style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        Restablecer contraseña
      </a>
    </p>
    <p style="margin:0 0 12px;font-size:13px;color:#5d6478;line-height:1.5;">
      El enlace vence en <strong>${input.vencimientoMinutos} minutos</strong>.
      Si no fuiste vos, ignorá este mail.
    </p>
  `;
  return {
    subject: `Restablecer contraseña · ${APP_NAME}`,
    html: layoutEmail({
      titulo: "Restablecer contraseña",
      saludo: `Hola ${input.nombrePersona},`,
      cuerpo,
    }),
    text: `Hola ${input.nombrePersona}, restablecé tu contraseña en: ${input.enlace} (vence en ${input.vencimientoMinutos} minutos).`,
  };
}
