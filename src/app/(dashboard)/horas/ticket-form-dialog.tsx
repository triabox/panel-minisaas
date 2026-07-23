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
import { actualizarTicket, crearTicket } from "@/modules/tickets/actions";

const SELECT_CLS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Initial = {
  id: string;
  clienteId: string;
  clienteNegocio: string;
  tipo: string;
  descripcion: string | null;
  horasHombre: number;
  tiempoIa: number;
  automatizado: boolean;
  fecha: Date | string;
};

type FormValues = {
  tipo: "bug" | "ajuste" | "feature" | "consulta";
  descripcion: string;
  horasHombre: string;
  tiempoIa: string;
  automatizado: boolean;
  fecha: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Initial;
};

const hoyISO = () => new Date().toISOString().slice(0, 10);
const aISO = (d: Date | string) =>
  (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

export function TicketFormDialog({ open, onOpenChange, initial }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar ticket" : "Cargar horas"}</DialogTitle>
          <DialogDescription>
            Cliente, tipo y horas. Se carga en segundos.
          </DialogDescription>
        </DialogHeader>
        {/* Inner remonta con defaults frescos cada vez que se abre. */}
        {open ? (
          <TicketFormInner
            key={initial?.id ?? "nuevo"}
            initial={initial}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TicketFormInner({
  initial,
  onClose,
}: {
  initial?: Initial;
  onClose: () => void;
}) {
  const router = useRouter();
  const editando = Boolean(initial);

  const [clienteId, setClienteId] = useState<string>(initial?.clienteId ?? "");
  const [clienteLabel, setClienteLabel] = useState<string | null>(
    initial?.clienteNegocio ?? null,
  );
  const [clienteError, setClienteError] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      tipo: (initial?.tipo as FormValues["tipo"]) ?? "consulta",
      descripcion: initial?.descripcion ?? "",
      horasHombre: initial ? String(initial.horasHombre) : "",
      tiempoIa: initial ? String(initial.tiempoIa) : "0",
      automatizado: initial?.automatizado ?? false,
      fecha: initial ? aISO(initial.fecha) : hoyISO(),
    },
  });

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    setClienteError(null);
    if (!clienteId) {
      setClienteError("Elegí un cliente.");
      return;
    }
    const payload = { ...values, clienteId };
    startTransition(async () => {
      const res = editando
        ? await actualizarTicket(initial!.id, payload)
        : await crearTicket(payload);
      if (res.ok) {
        toast.success(editando ? "Ticket actualizado" : "Horas cargadas");
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
          selectedLabel={clienteLabel}
          minChars={2}
          placeholder="Buscar cliente..."
          searchPlaceholder="Nombre del negocio..."
          ariaInvalid={Boolean(clienteError)}
          onChange={(value, option) => {
            setClienteId(value ?? "");
            setClienteLabel(option?.label ?? null);
            setClienteError(null);
          }}
        />
        {clienteError ? (
          <p className="text-sm text-destructive">{clienteError}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <select id="tipo" className={SELECT_CLS} {...register("tipo")}>
            <option value="bug">Bug</option>
            <option value="ajuste">Ajuste</option>
            <option value="feature">Feature</option>
            <option value="consulta">Consulta</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" type="date" {...register("fecha")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="horasHombre">Horas-hombre *</Label>
          <Input
            id="horasHombre"
            type="number"
            min={0}
            step="0.25"
            autoFocus
            placeholder="0.5"
            aria-invalid={Boolean(errors.horasHombre)}
            {...register("horasHombre", { required: "Ingresá las horas." })}
          />
          {errors.horasHombre ? (
            <p className="text-sm text-destructive">
              {errors.horasHombre.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tiempoIa">Tiempo IA (h)</Label>
          <Input
            id="tiempoIa"
            type="number"
            min={0}
            step="0.25"
            aria-invalid={Boolean(errors.tiempoIa)}
            {...register("tiempoIa", { required: "Ingresá el tiempo IA." })}
          />
          {errors.tiempoIa ? (
            <p className="text-sm text-destructive">{errors.tiempoIa.message}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="automatizado"
          type="checkbox"
          className="size-4 rounded border-input accent-primary-600"
          {...register("automatizado")}
        />
        <Label htmlFor="automatizado" className="font-normal">
          Se resolvió de forma automatizada (IA)
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          rows={2}
          placeholder="Qué pidió / qué se hizo (opcional)"
          {...register("descripcion")}
        />
        {errors.descripcion ? (
          <p className="text-sm text-destructive">{errors.descripcion.message}</p>
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
          ) : editando ? (
            "Guardar cambios"
          ) : (
            "Cargar horas"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
