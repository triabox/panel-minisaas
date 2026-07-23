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
import {
  eliminarEtiqueta,
  toggleEtiquetaActiva,
} from "@/modules/etiquetas/actions";
import { EtiquetaFormDialog } from "./etiqueta-form-dialog";

type EtiquetaRow = {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
  cantidadUsos: number;
};

export function EtiquetaAcciones({ etiqueta }: { etiqueta: EtiquetaRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      const res = await toggleEtiquetaActiva(etiqueta.id);
      if (res.ok) {
        toast.success(res.data.activo ? "Etiqueta activada" : "Etiqueta desactivada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onEliminar = () => {
    if (
      !window.confirm(
        `¿Eliminar la etiqueta "${etiqueta.nombre}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await eliminarEtiqueta(etiqueta.id);
      if (res.ok) {
        toast.success("Etiqueta eliminada");
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
            aria-label={`Acciones para ${etiqueta.nombre}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil className="size-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggle}>
            <Power className="size-4" />
            {etiqueta.activo ? "Desactivar" : "Activar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={onEliminar}
            disabled={etiqueta.cantidadUsos > 0}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EtiquetaFormDialog
        open={editing}
        onOpenChange={setEditing}
        initial={etiqueta}
      />
    </>
  );
}
