"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { toast } from "sonner";
import { actualizarCapacidad } from "@/modules/capacidad/actions";

type FormValues = { horasSoporteMes: string; clientesObjetivo: string };

export function CapacidadForm({
  inicial,
}: {
  inicial: { horasSoporteMes: number; clientesObjetivo: number };
}) {
  const router = useRouter();
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      horasSoporteMes: String(inicial.horasSoporteMes),
      clientesObjetivo: String(inicial.clientesObjetivo),
    },
  });

  const horas = Number(watch("horasSoporteMes")) || 0;
  const clientes = Number(watch("clientesObjetivo")) || 0;
  const umbral = clientes > 0 ? horas / clientes : 0;

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    startTransition(async () => {
      const res = await actualizarCapacidad(values);
      if (res.ok) {
        toast.success("Capacidad actualizada");
        router.refresh();
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-5 rounded-xl border border-primary-100 bg-white p-6"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="horasSoporteMes">Horas de soporte al mes</Label>
          <Input
            id="horasSoporteMes"
            type="number"
            min={1}
            aria-invalid={Boolean(errors.horasSoporteMes)}
            {...register("horasSoporteMes", { required: "Requerido." })}
          />
          <p className="text-xs text-muted-foreground">
            Las que dedicás a atender, no a vender ni desarrollar.
          </p>
          {errors.horasSoporteMes ? (
            <p className="text-sm text-destructive">
              {errors.horasSoporteMes.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientesObjetivo">Clientes objetivo</Label>
          <Input
            id="clientesObjetivo"
            type="number"
            min={1}
            aria-invalid={Boolean(errors.clientesObjetivo)}
            {...register("clientesObjetivo", { required: "Requerido." })}
          />
          <p className="text-xs text-muted-foreground">
            La meta de clientes que querés sostener.
          </p>
          {errors.clientesObjetivo ? (
            <p className="text-sm text-destructive">
              {errors.clientesObjetivo.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
          Umbral por cliente
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-teal-800">
          {umbral.toFixed(1)}{" "}
          <span className="text-sm font-normal text-teal-600">
            h / cliente / mes
          </span>
        </p>
        <p className="mt-1 text-xs text-teal-700">
          Todo cliente que supere estas horas en el mes se marca en rojo.
        </p>
      </div>

      {errorGlobal ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorGlobal}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Guardando...
          </>
        ) : (
          "Guardar capacidad"
        )}
      </Button>
    </form>
  );
}
