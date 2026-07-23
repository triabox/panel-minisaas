"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { cambiarMiPasswordSchema } from "@/core/auth/cuenta-schemas";
import { cambiarMiPassword } from "@/core/auth/cuenta-actions";

type FormValues = {
  passwordActual: string;
  passwordNueva: string;
  confirmacion: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CambiarPasswordDialog({ open, onOpenChange }: Props) {
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(cambiarMiPasswordSchema),
    defaultValues: {
      passwordActual: "",
      passwordNueva: "",
      confirmacion: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    startTransition(async () => {
      const res = await cambiarMiPassword(values);
      if (res.ok) {
        toast.success("Contraseña actualizada");
        reset();
        onOpenChange(false);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Ingresá tu contraseña actual y elegí una nueva.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="passwordActual">Contraseña actual</Label>
            <Input
              id="passwordActual"
              type="password"
              autoComplete="current-password"
              autoFocus
              aria-invalid={Boolean(errors.passwordActual)}
              {...register("passwordActual")}
            />
            {errors.passwordActual ? (
              <p className="text-sm text-destructive">
                {errors.passwordActual.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordNueva">Nueva contraseña</Label>
            <Input
              id="passwordNueva"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.passwordNueva)}
              {...register("passwordNueva")}
            />
            {errors.passwordNueva ? (
              <p className="text-sm text-destructive">
                {errors.passwordNueva.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres. Usá una mezcla de letras y números.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmacion">Repetir nueva contraseña</Label>
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
              ) : (
                "Cambiar contraseña"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
