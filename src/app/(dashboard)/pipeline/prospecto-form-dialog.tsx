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
import { toast } from "sonner";

import { actualizarProspecto, crearProspecto } from "@/modules/prospectos/actions";

export type RubroOpt = { id: string; nombre: string };

const SELECT_CLS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const aISO = (d: Date | string) =>
  (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

export type ProspectoInitial = {
  id: string;
  negocio: string;
  rubroId: string | null;
  contactoNombre: string | null;
  contactoEmail: string | null;
  contactoTelefono: string | null;
  direccion: string | null;
  estado: string;
  fechaRecordatorio: Date | string | null;
  notas: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rubros: RubroOpt[];
  initial?: ProspectoInitial;
};

export function ProspectoFormDialog({ open, onOpenChange, rubros, initial }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar prospecto" : "Nuevo prospecto"}
          </DialogTitle>
          <DialogDescription>
            Cargá la dirección y el mapa lo ubica solo (geocoding automático).
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <Inner
            key={initial?.id ?? "nuevo"}
            rubros={rubros}
            initial={initial}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type FormValues = {
  negocio: string;
  rubroId: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  direccion: string;
  estado: string;
  fechaRecordatorio: string;
  notas: string;
};

function Inner({
  rubros,
  initial,
  onClose,
}: {
  rubros: RubroOpt[];
  initial?: ProspectoInitial;
  onClose: () => void;
}) {
  const router = useRouter();
  const editando = Boolean(initial);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      negocio: initial?.negocio ?? "",
      rubroId: initial?.rubroId ?? "",
      contactoNombre: initial?.contactoNombre ?? "",
      contactoEmail: initial?.contactoEmail ?? "",
      contactoTelefono: initial?.contactoTelefono ?? "",
      direccion: initial?.direccion ?? "",
      estado: initial?.estado ?? "contactado",
      fechaRecordatorio: initial?.fechaRecordatorio
        ? aISO(initial.fechaRecordatorio)
        : "",
      notas: initial?.notas ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    startTransition(async () => {
      const res = editando
        ? await actualizarProspecto(initial!.id, values)
        : await crearProspecto(values);
      if (res.ok) {
        toast.success(editando ? "Prospecto actualizado" : "Prospecto creado");
        onClose();
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="negocio">Negocio *</Label>
        <Input
          id="negocio"
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(errors.negocio)}
          {...register("negocio", { required: "Ingresá el negocio." })}
        />
        {errors.negocio ? (
          <p className="text-sm text-destructive">{errors.negocio.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rubroId">Rubro</Label>
          <select id="rubroId" className={SELECT_CLS} {...register("rubroId")}>
            <option value="">— Sin rubro —</option>
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <select id="estado" className={SELECT_CLS} {...register("estado")}>
            <option value="contactado">Contactado</option>
            <option value="demo">Demo</option>
            <option value="prueba">Prueba</option>
            <option value="cerrado">Cerrado</option>
            <option value="descartado">Descartado</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          autoComplete="off"
          placeholder="Av. Corrientes 1234, CABA"
          {...register("direccion")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactoNombre">Contacto</Label>
          <Input id="contactoNombre" autoComplete="off" {...register("contactoNombre")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fechaRecordatorio">Recordatorio</Label>
          <Input
            id="fechaRecordatorio"
            type="date"
            {...register("fechaRecordatorio")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactoEmail">Email</Label>
          <Input
            id="contactoEmail"
            type="email"
            autoComplete="off"
            aria-invalid={Boolean(errors.contactoEmail)}
            {...register("contactoEmail")}
          />
          {errors.contactoEmail ? (
            <p className="text-sm text-destructive">
              {errors.contactoEmail.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactoTelefono">Teléfono</Label>
          <Input
            id="contactoTelefono"
            autoComplete="off"
            {...register("contactoTelefono")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" rows={2} {...register("notas")} />
      </div>

      {errorGlobal ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorGlobal}
        </div>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
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
            "Crear prospecto"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
