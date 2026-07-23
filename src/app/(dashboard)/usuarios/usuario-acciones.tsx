"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Power,
  Unlock,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/ui/dropdown-menu";
import { Button } from "@/core/ui/button";
import { toast } from "sonner";
import {
  desbloquearUsuario,
  toggleUsuarioActivo,
} from "@/modules/usuarios/actions";

import { UsuarioFormDialog } from "./usuario-form-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

type Rol = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

type UsuarioRow = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  bloqueada: boolean;
  rolesCodigos: string[];
};

export function UsuarioAcciones({
  usuario,
  roles,
}: {
  usuario: UsuarioRow;
  roles: Rol[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [, startTransition] = useTransition();

  const onToggleActiva = () => {
    startTransition(async () => {
      const res = await toggleUsuarioActivo(usuario.id);
      if (res.ok) {
        toast.success(
          res.data.activo ? "Usuario activado" : "Usuario desactivado",
        );
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onDesbloquear = () => {
    startTransition(async () => {
      const res = await desbloquearUsuario(usuario.id);
      if (res.ok) {
        toast.success("Usuario desbloqueada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Acciones para ${usuario.email}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil className="size-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setResetting(true)}>
            <KeyRound className="size-4" /> Restablecer contraseña
          </DropdownMenuItem>
          {usuario.bloqueada ? (
            <DropdownMenuItem onSelect={onDesbloquear}>
              <Unlock className="size-4" /> Desbloquear
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onToggleActiva}>
            <Power className="size-4" />
            {usuario.activo ? "Desactivar" : "Activar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UsuarioFormDialog
        open={editing}
        onOpenChange={setEditing}
        roles={roles}
        initial={{
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          rolesCodigos: usuario.rolesCodigos,
        }}
      />
      <ResetPasswordDialog
        open={resetting}
        onOpenChange={setResetting}
        usuarioId={usuario.id}
        usuarioEmail={usuario.email}
      />
    </>
  );
}
