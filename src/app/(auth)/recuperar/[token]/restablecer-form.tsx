"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { restablecerSchema } from "@/core/auth/recupero-schemas";
import { restablecerPasswordConToken } from "@/core/auth/recupero-actions";

type FormValues = {
  token: string;
  password: string;
  confirmacion: string;
};

export function RestablecerForm({ token }: { token: string }) {
  const router = useRouter();
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(restablecerSchema),
    defaultValues: { token, password: "", confirmacion: "" },
  });

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    startTransition(async () => {
      const res = await restablecerPasswordConToken(values);
      if (res.ok) {
        toast.success("Contraseña actualizada. Ya podés ingresar.");
        router.push("/ingresar");
      } else {
        if (res.campos) {
          for (const [campo, mensaje] of Object.entries(res.campos)) {
            setError(campo as keyof FormValues, { message: mensaje });
          }
        }
        setErrorGlobal(res.error);
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <input type="hidden" {...register("token")} />

        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            autoFocus
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmacion">Repetir contraseña</Label>
          <Input
            id="confirmacion"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmacion)}
            {...register("confirmacion")}
          />
          {errors.confirmacion ? (
            <p className="text-sm text-destructive">
              {errors.confirmacion.message}
            </p>
          ) : null}
        </div>

        {errorGlobal ? (
          <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p>{errorGlobal}</p>
            <Link
              href="/recuperar"
              className="inline-block text-xs underline-offset-4 hover:underline"
            >
              Pedir un enlace nuevo
            </Link>
          </div>
        ) : null}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar contraseña"
          )}
        </Button>
      </form>
    </>
  );
}
