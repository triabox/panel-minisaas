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

export type RubroOption = { id: string; codigo: string; nombre: string };

const SELECT_CLS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type FormValues = {
  negocio: string;
  rubroId: string;
  sistema: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  fechaAlta: string;
  abonoMensual: string;
  moneda: "USD" | "ARS";
  estado: "activo" | "pausado" | "baja";
  estadoPago: "al_dia" | "demorado" | "vencido";
  notas: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rubros: RubroOption[];
  initial?: {
    id: string;
    negocio: string;
    rubroId: string | null;
    sistema: string | null;
    contactoNombre: string | null;
    contactoEmail: string | null;
    contactoTelefono: string | null;
    fechaAlta: Date | string;
    abonoMensual: number;
    moneda: string;
    estado: string;
    estadoPago: string;
    notas: string | null;
  };
};

const hoyISO = () => new Date().toISOString().slice(0, 10);
const aISO = (d: Date | string) =>
  (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

export function ClienteFormDialog({ open, onOpenChange, rubros, initial }: Props) {
  const router = useRouter();
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editando = Boolean(initial);

  const valoresIniciales = (): FormValues => ({
    negocio: initial?.negocio ?? "",
    rubroId: initial?.rubroId ?? "",
    sistema: initial?.sistema ?? "",
    contactoNombre: initial?.contactoNombre ?? "",
    contactoEmail: initial?.contactoEmail ?? "",
    contactoTelefono: initial?.contactoTelefono ?? "",
    fechaAlta: initial ? aISO(initial.fechaAlta) : hoyISO(),
    abonoMensual: initial ? String(initial.abonoMensual) : "100",
    moneda: (initial?.moneda as FormValues["moneda"]) ?? "USD",
    estado: (initial?.estado as FormValues["estado"]) ?? "activo",
    estadoPago: (initial?.estadoPago as FormValues["estadoPago"]) ?? "al_dia",
    notas: initial?.notas ?? "",
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: valoresIniciales() });

  useEffect(() => {
    if (open) reset(valoresIniciales());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, reset]);

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
            El nombre del negocio y el abono alcanzan para empezar; el resto es
            opcional.
          </DialogDescription>
        </DialogHeader>

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
              <Label htmlFor="sistema">Sistema entregado</Label>
              <Input
                id="sistema"
                autoComplete="off"
                placeholder="ej: Turnos, Inventario…"
                {...register("sistema")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fechaAlta">Alta *</Label>
              <Input
                id="fechaAlta"
                type="date"
                aria-invalid={Boolean(errors.fechaAlta)}
                {...register("fechaAlta", { required: "Ingresá la fecha." })}
              />
              {errors.fechaAlta ? (
                <p className="text-sm text-destructive">
                  {errors.fechaAlta.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="abonoMensual">Abono mensual *</Label>
              <Input
                id="abonoMensual"
                type="number"
                min={0}
                step="0.01"
                aria-invalid={Boolean(errors.abonoMensual)}
                {...register("abonoMensual", { required: "Ingresá el abono." })}
              />
              {errors.abonoMensual ? (
                <p className="text-sm text-destructive">
                  {errors.abonoMensual.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <select id="moneda" className={SELECT_CLS} {...register("moneda")}>
                <option value="USD">US$ (dólares)</option>
                <option value="ARS">$ (pesos)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <select id="estado" className={SELECT_CLS} {...register("estado")}>
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estadoPago">Estado de pago</Label>
              <select
                id="estadoPago"
                className={SELECT_CLS}
                {...register("estadoPago")}
              >
                <option value="al_dia">Al día</option>
                <option value="demorado">Paga demorado</option>
                <option value="vencido">Pago vencido</option>
              </select>
            </div>
          </div>

          <fieldset className="space-y-3 rounded-lg border border-primary-100 p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">
              Contacto
            </legend>
            <div className="space-y-2">
              <Label htmlFor="contactoNombre">Nombre de contacto</Label>
              <Input
                id="contactoNombre"
                autoComplete="off"
                {...register("contactoNombre")}
              />
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
          </fieldset>

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
