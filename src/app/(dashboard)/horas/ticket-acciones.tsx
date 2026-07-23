"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/ui/dropdown-menu";
import { Button } from "@/core/ui/button";
import { toast } from "sonner";
import { eliminarTicket, obtenerTicket } from "@/modules/tickets/actions";

import { TicketFormDialog } from "./ticket-form-dialog";

type Props = {
  ticket: { id: string; clienteNegocio: string };
  esGestion: boolean;
};

export function TicketAcciones({ ticket, esGestion }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [initial, setInitial] =
    useState<Parameters<typeof TicketFormDialog>[0]["initial"]>();
  const [, startTransition] = useTransition();

  const onEditar = () => {
    startTransition(async () => {
      const data = await obtenerTicket(ticket.id);
      if (!data) {
        toast.error("No se pudo cargar el ticket.");
        return;
      }
      setInitial(data);
      setEditOpen(true);
    });
  };

  const onEliminar = () => {
    if (
      !window.confirm(
        `¿Eliminar este ticket de "${ticket.clienteNegocio}"?\n\nAfecta las métricas históricas. No se puede deshacer.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await eliminarTicket(ticket.id);
      if (res.ok) {
        toast.success("Ticket eliminado.");
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
          <Button size="icon" variant="ghost" aria-label="Acciones del ticket">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEditar}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
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

      <TicketFormDialog open={editOpen} onOpenChange={setEditOpen} initial={initial} />
    </>
  );
}
