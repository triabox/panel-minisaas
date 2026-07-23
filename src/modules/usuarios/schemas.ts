import { z } from "zod";

export const usuarioInputSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre muy corto.").max(60),
  apellido: z.string().trim().min(2, "Apellido muy corto.").max(60),
  documento: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z
      .string()
      .trim()
      .regex(/^\d{6,10}$/, "Documento inválido. Sólo números, 6 a 10 dígitos.")
      .optional(),
  ),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  rolesCodigos: z.array(z.string()).min(1, "Asigná al menos un rol."),
  password: z
    .string()
    .min(8, "La contraseña tiene que tener al menos 8 caracteres.")
    .max(100),
});

export type UsuarioInput = z.infer<typeof usuarioInputSchema>;

export const usuarioEditarSchema = usuarioInputSchema.omit({
  password: true,
});

export type UsuarioEditar = z.infer<typeof usuarioEditarSchema>;

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "La contraseña tiene que tener al menos 8 caracteres.")
    .max(100),
});
