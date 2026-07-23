"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/ui/dropdown-menu";
import { Button } from "@/core/ui/button";
import { toast } from "sonner";
import { eliminarRubro, toggleRubroActivo } from "@/modules/rubros/actions";

import { RubroFormDialog } from "./rubro-form-dialog";

type Rubro = {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
};

export function RubroAcciones({ rubro }: { rubro: Rubro }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      const res = await toggleRubroActivo(rubro.id);
      if (res.ok) {
        toast.success(res.data.activo ? "Rubro activado" : "Rubro desactivado");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onEliminar = () => {
    if (!window.confirm(`¿Eliminar el rubro "${rubro.nombre}"?`)) return;
    startTransition(async () => {
      const res = await eliminarRubro(rubro.id);
      if (res.ok) {
        toast.success("Rubro eliminado.");
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
            aria-label={`Acciones para ${rubro.nombre}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggle}>
            <Power className="size-4" />
            {rubro.activo ? "Desactivar" : "Activar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onEliminar}>
            <Trash2 className="size-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RubroFormDialog open={editOpen} onOpenChange={setEditOpen} initial={rubro} />
    </>
  );
}
