"use client";

import { useState, useTransition } from "react";
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
import { AsyncCombobox } from "@/core/ui/async-combobox";
import { toast } from "sonner";

import { buscarClientes } from "@/modules/clientes/actions";
import { crearMejora } from "@/modules/mejoras/actions";

type Props = { open: boolean; onOpenChange: (o: boolean) => void };

export function MejoraFormDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva mejora</DialogTitle>
          <DialogDescription>
            Se habilita sola si el cliente ya registró su primer pago; si no,
            queda pendiente.
          </DialogDescription>
        </DialogHeader>
        {open ? <Inner onClose={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

type FormValues = { titulo: string; descripcion: string };

function Inner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState("");
  const [clienteError, setClienteError] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { titulo: "", descripcion: "" } });

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    setClienteError(null);
    if (!clienteId) {
      setClienteError("Elegí un cliente.");
      return;
    }
    startTransition(async () => {
      const res = await crearMejora({ ...values, clienteId });
      if (res.ok) {
        toast.success("Mejora creada");
        onClose();
        router.refresh();
      } else {
        if (res.campos) {
          for (const [campo, mensaje] of Object.entries(res.campos)) {
            if (campo === "clienteId") setClienteError(mensaje);
            else setError(campo as keyof FormValues, { message: mensaje });
          }
        }
        setErrorGlobal(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="cliente">Cliente *</Label>
        <AsyncCombobox
          id="cliente"
          search={buscarClientes}
          value={clienteId || null}
          minChars={2}
          placeholder="Buscar cliente..."
          searchPlaceholder="Nombre del negocio..."
          ariaInvalid={Boolean(clienteError)}
          onChange={(value) => {
            setClienteId(value ?? "");
            setClienteError(null);
          }}
        />
        {clienteError ? (
          <p className="text-sm text-destructive">{clienteError}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(errors.titulo)}
          {...register("titulo", { required: "Ingresá un título." })}
        />
        {errors.titulo ? (
          <p className="text-sm text-destructive">{errors.titulo.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" rows={2} {...register("descripcion")} />
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
          onClick={onClose}
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
          ) : (
            "Crear mejora"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
