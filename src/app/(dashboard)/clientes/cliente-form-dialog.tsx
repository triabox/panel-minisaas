"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/core/ui/textarea";
import { toast } from "sonner";
import { actualizarCliente, crearCliente } from "@/modules/clientes/actions";

export type EtiquetaOption = { id: string; codigo: string; nombre: string };

type FormValues = {
  nombre: string;
  email: string;
  telefono: string;
  notas: string;
  etiquetasIds: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etiquetas: EtiquetaOption[];
  initial?: {
    id: string;
    nombre: string;
    email: string | null;
    telefono: string | null;
    notas: string | null;
    etiquetasIds: string[];
  };
};

export function ClienteFormDialog({ open, onOpenChange, etiquetas, initial }: Props) {
  const router = useRouter();
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editando = Boolean(initial);

  const valoresIniciales = (): FormValues => ({
    nombre: initial?.nombre ?? "",
    email: initial?.email ?? "",
    telefono: initial?.telefono ?? "",
    notas: initial?.notas ?? "",
    etiquetasIds: initial?.etiquetasIds ?? [],
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: valoresIniciales() });

  useEffect(() => {
    if (open) reset(valoresIniciales());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, reset]);

  const seleccionadas = watch("etiquetasIds");

  const toggleEtiqueta = (id: string) => {
    const actual = new Set(seleccionadas);
    if (actual.has(id)) actual.delete(id);
    else actual.add(id);
    setValue("etiquetasIds", [...actual]);
  };

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    startTransition(async () => {
      const res = editando
        ? await actualizarCliente(initial!.id, values)
        : await crearCliente(values);
      if (res.ok) {
        toast.success(editando ? "Cliente actualizado" : "Cliente creado");
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
        if (!o) {
          reset();
          setErrorGlobal(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>
            Los datos de contacto son opcionales; el nombre alcanza para
            empezar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              autoComplete="off"
              autoFocus
              aria-invalid={Boolean(errors.nombre)}
              {...register("nombre", { required: "Ingresá el nombre." })}
            />
            {errors.nombre ? (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                autoComplete="off"
                {...register("telefono")}
              />
            </div>
          </div>

          {etiquetas.length > 0 ? (
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2">
                {etiquetas.map((e) => {
                  const activa = seleccionadas.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleEtiqueta(e.id)}
                      aria-pressed={activa}
                      className={
                        activa
                          ? "rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white"
                          : "rounded-full border border-input px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary-300"
                      }
                    >
                      {e.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" rows={2} {...register("notas")} />
            {errors.notas ? (
              <p className="text-sm text-destructive">{errors.notas.message}</p>
            ) : null}
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
                "Crear cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
