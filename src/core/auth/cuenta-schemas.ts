import { z } from "zod";

export const cambiarMiPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, "Ingresá tu contraseña actual."),
    passwordNueva: z
      .string()
      .min(8, "La nueva contraseña tiene que tener al menos 8 caracteres.")
      .max(100),
    confirmacion: z.string(),
  })
  .refine((d) => d.passwordNueva === d.confirmacion, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmacion"],
  })
  .refine((d) => d.passwordNueva !== d.passwordActual, {
    message: "La nueva contraseña tiene que ser distinta de la actual.",
    path: ["passwordNueva"],
  });

export type CambiarMiPasswordInput = z.infer<typeof cambiarMiPasswordSchema>;
