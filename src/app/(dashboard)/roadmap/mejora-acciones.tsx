"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Check, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/ui/dropdown-menu";
import { Button } from "@/core/ui/button";
import { toast } from "sonner";
import { eliminarMejora, marcarMejoraEntregada } from "@/modules/mejoras/actions";

type Props = {
  mejora: { id: string; clienteNegocio: string; titulo: string; estado: string };
  esGestion: boolean;
};

export function MejoraAcciones({ mejora, esGestion }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const onEntregar = () => {
    startTransition(async () => {
      const res = await marcarMejoraEntregada(mejora.id);
      if (res.ok) {
        toast.success("Mejora marcada como entregada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onEliminar = () => {
    if (!window.confirm(`¿Eliminar la mejora "${mejora.titulo}"?`)) return;
    startTransition(async () => {
      const res = await eliminarMejora(mejora.id);
      if (res.ok) {
        toast.success("Mejora eliminada.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Acciones de la mejora">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {mejora.estado !== "entregada" ? (
          <DropdownMenuItem onSelect={onEntregar}>
            <Check className="size-4" />
            Marcar entregada
          </DropdownMenuItem>
        ) : null}
        {esGestion ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onEliminar}>
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
