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
import { toast } from "sonner";
import { actualizarUsuario, crearUsuario } from "@/modules/usuarios/actions";

type RolOption = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

type FormValues = {
  nombre: string;
  apellido: string;
  documento: string;
  email: string;
  password: string;
  rolesCodigos: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RolOption[];
  initial?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rolesCodigos: string[];
  };
};

export function UsuarioFormDialog({ open, onOpenChange, roles, initial }: Props) {
  const router = useRouter();
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editando = Boolean(initial);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      nombre: initial?.nombre ?? "",
      apellido: initial?.apellido ?? "",
      documento: "",
      email: initial?.email ?? "",
      password: "",
      rolesCodigos: initial?.rolesCodigos ?? [],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        nombre: initial?.nombre ?? "",
        apellido: initial?.apellido ?? "",
        documento: "",
        email: initial?.email ?? "",
        password: "",
        rolesCodigos: initial?.rolesCodigos ?? [],
      });
    }
  }, [open, initial, reset]);

  const rolesSeleccionados = watch("rolesCodigos");

  const toggleRol = (codigo: string) => {
    const actual = new Set(rolesSeleccionados);
    if (actual.has(codigo)) actual.delete(codigo);
    else actual.add(codigo);
    setValue("rolesCodigos", [...actual], { shouldValidate: false });
  };

  const onSubmit = (values: FormValues) => {
    setErrorGlobal(null);
    const payload = {
      nombre: values.nombre,
      apellido: values.apellido,
      documento: values.documento || undefined,
      email: values.email,
      rolesCodigos: values.rolesCodigos,
      ...(editando ? {} : { password: values.password }),
    };
    startTransition(async () => {
      const res = editando
        ? await actualizarUsuario(initial!.id, payload)
        : await crearUsuario(payload);
      if (res.ok) {
        toast.success(editando ? "Usuario actualizado" : "Usuario creado");
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
          <DialogTitle>{editando ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "Datos y roles de la cuenta."
              : "Crea la persona y su cuenta de acceso en un solo paso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                autoComplete="off"
                aria-invalid={Boolean(errors.nombre)}
                {...register("nombre", { required: "Ingresá el nombre." })}
              />
              {errors.nombre ? (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                autoComplete="off"
                aria-invalid={Boolean(errors.apellido)}
                {...register("apellido", { required: "Ingresá el apellido." })}
              />
              {errors.apellido ? (
                <p className="text-sm text-destructive">
                  {errors.apellido.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                aria-invalid={Boolean(errors.email)}
                {...register("email", { required: "Ingresá el email." })}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            {!editando ? (
              <div className="space-y-2">
                <Label htmlFor="documento">Documento (opcional)</Label>
                <Input
                  id="documento"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.documento)}
                  {...register("documento")}
                />
                {errors.documento ? (
                  <p className="text-sm text-destructive">
                    {errors.documento.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {!editando ? (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña inicial</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password", {
                  required: "Ingresá una contraseña inicial.",
                  minLength: { value: 8, message: "Mínimo 8 caracteres." },
                })}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Compartila por un canal seguro. El usuario puede cambiarla
                  desde su menú.
                </p>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-2 rounded-lg border border-input p-3">
              {roles.map((rol) => (
                <label
                  key={rol.codigo}
                  className="flex cursor-pointer items-start gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 rounded border-input accent-primary-600"
                    checked={rolesSeleccionados.includes(rol.codigo)}
                    onChange={() => toggleRol(rol.codigo)}
                  />
                  <span>
                    <span className="font-medium">{rol.nombre}</span>
                    {rol.descripcion ? (
                      <span className="block text-xs text-muted-foreground">
                        {rol.descripcion}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
            {rolesSeleccionados.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Asigná al menos un rol.
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
            <Button
              type="submit"
              disabled={isPending || rolesSeleccionados.length === 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : editando ? (
                "Guardar cambios"
              ) : (
                "Crear usuario"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
