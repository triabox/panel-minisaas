"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { recuperoSchema } from "@/core/auth/recupero-schemas";
import { solicitarRecuperoPassword } from "@/core/auth/recupero-actions";

type FormValues = { email: string };

export function RecuperoForm() {
  const [enviado, setEnviado] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(recuperoSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    startTransition(async () => {
      const res = await solicitarRecuperoPassword(values);
      if (res.ok) {
        setEnviado(true);
      } else {
        setErrorGlobal(res.error);
      }
    });
  };

  if (enviado) {
    return (
      <div className="space-y-3 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-medium">Listo.</p>
        <p>
          Si el email está registrado, te enviamos un enlace para restablecer
          la contraseña. Revisá tu bandeja (y la carpeta de spam) en los
          próximos minutos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoFocus
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      {errorGlobal ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorGlobal}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviarme el enlace"
        )}
      </Button>
    </form>
  );
}
