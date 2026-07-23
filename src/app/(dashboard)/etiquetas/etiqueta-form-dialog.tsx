"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/ui/dialog";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import type { z } from "zod";
import { etiquetaInputSchema } from "@/modules/etiquetas/schemas";
import {
  actualizarEtiqueta,
  crearEtiqueta,
} from "@/modules/etiquetas/actions";

type FormValues = z.input<typeof etiquetaInputSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: {
    id: string;
    codigo: string;
    nombre: string;
    activo: boolean;
    orden: number;
  };
};

export function EtiquetaFormDialog({
  open,
  onOpenChange,
  initial,
}: Props) {
  const router = useRouter();
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editando = Boolean(initial);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(etiquetaInputSchema),
    defaultValues: {
      codigo: initial?.codigo ?? "",
      nombre: initial?.nombre ?? "",
      activo: initial?.activo ?? true,
      orden: initial?.orden ?? 0,
    },
  });

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    startTransition(async () => {
      const res = editando
        ? await actualizarEtiqueta(initial!.id, values)
        : await crearEtiqueta(values);
      if (res.ok) {
        reset();
        onOpenChange(false);
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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar etiqueta" : "Nuevo etiqueta"}
          </DialogTitle>
          <DialogDescription>
            El código se usa internamente; el nombre es el que se ve al cargar
            un cliente.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              autoComplete="off"
              autoFocus
              placeholder="ej: entrevista"
              aria-invalid={Boolean(errors.codigo)}
              {...register("codigo")}
            />
            {errors.codigo ? (
              <p className="text-sm text-destructive">
                {errors.codigo.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              autoComplete="off"
              aria-invalid={Boolean(errors.nombre)}
              {...register("nombre")}
            />
            {errors.nombre ? (
              <p className="text-sm text-destructive">
                {errors.nombre.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="orden">Orden</Label>
            <Input
              id="orden"
              type="number"
              min={0}
              max={999}
              aria-invalid={Boolean(errors.orden)}
              {...register("orden")}
            />
            {errors.orden ? (
              <p className="text-sm text-destructive">
                {errors.orden.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Más bajo aparece primero en el selector.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="activo"
              type="checkbox"
              className="size-4 rounded border-input accent-primary-600"
              {...register("activo")}
            />
            <Label htmlFor="activo" className="font-normal">
              Activa (visible al etiquetar clientes)
            </Label>
          </div>

          {errorGlobal ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorGlobal}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : editando ? (
                "Guardar cambios"
              ) : (
                "Crear etiqueta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
