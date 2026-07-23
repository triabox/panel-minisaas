import { z } from "zod";

export const recuperoSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
});

export const restablecerSchema = z
  .object({
    token: z.string().min(20, "Token inválido."),
    password: z
      .string()
      .min(8, "La contraseña tiene que tener al menos 8 caracteres.")
      .max(100),
    confirmacion: z.string(),
  })
  .refine((d) => d.password === d.confirmacion, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmacion"],
  });

export type RecuperoInput = z.infer<typeof recuperoSchema>;
export type RestablecerInput = z.infer<typeof restablecerSchema>;
