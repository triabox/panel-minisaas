"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoveRight, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/ui/dropdown-menu";
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
import {
  eliminarProspecto,
  moverProspecto,
  obtenerProspecto,
} from "@/modules/prospectos/actions";

import {
  ProspectoFormDialog,
  type ProspectoInitial,
  type RubroOpt,
} from "./prospecto-form-dialog";

const SELECT_CLS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Props = {
  prospecto: { id: string; negocio: string; estado: string };
  rubros: RubroOpt[];
  esGestion: boolean;
};

export function ProspectoAcciones({ prospecto, rubros, esGestion }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [moverOpen, setMoverOpen] = useState(false);
  const [initial, setInitial] = useState<ProspectoInitial>();
  const [, startTransition] = useTransition();

  const onEditar = () => {
    startTransition(async () => {
      const data = await obtenerProspecto(prospecto.id);
      if (!data) {
        toast.error("No se pudo cargar el prospecto.");
        return;
      }
      setInitial(data);
      setEditOpen(true);
    });
  };

  const onEliminar = () => {
    if (!window.confirm(`¿Eliminar el prospecto "${prospecto.negocio}"?`)) return;
    startTransition(async () => {
      const res = await eliminarProspecto(prospecto.id);
      if (res.ok) {
        toast.success("Prospecto eliminado.");
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
          <Button size="icon" variant="ghost" aria-label={`Acciones para ${prospecto.negocio}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setMoverOpen(true)}>
            <MoveRight className="size-4" />
            Mover de estado
          </DropdownMenuItem>
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

      <ProspectoFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        rubros={rubros}
        initial={initial}
      />

      <MoverDialog
        open={moverOpen}
        onOpenChange={setMoverOpen}
        prospecto={prospecto}
      />
    </>
  );
}

function MoverDialog({
  open,
  onOpenChange,
  prospecto,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prospecto: { id: string; negocio: string; estado: string };
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover “{prospecto.negocio}”</DialogTitle>
          <DialogDescription>
            Registrá el nuevo estado y las horas que le dedicaste (suman al CAC).
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <MoverInner
            prospecto={prospecto}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MoverInner({
  prospecto,
  onClose,
}: {
  prospecto: { id: string; estado: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(prospecto.estado);
  const [horas, setHoras] = useState("0");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    startTransition(async () => {
      const res = await moverProspecto(prospecto.id, { estado, horas, nota: "" });
      if (res.ok) {
        toast.success("Prospecto movido.");
        onClose();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mover-estado">Nuevo estado</Label>
          <select
            id="mover-estado"
            className={SELECT_CLS}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="contactado">Contactado</option>
            <option value="demo">Demo</option>
            <option value="prueba">Prueba</option>
            <option value="cerrado">Cerrado</option>
            <option value="descartado">Descartado</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mover-horas">Horas dedicadas</Label>
          <Input
            id="mover-horas"
            type="number"
            min={0}
            step="0.25"
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Mover"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
