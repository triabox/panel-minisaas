"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/core/ui/button";
import { UsuarioFormDialog } from "./usuario-form-dialog";

type Rol = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

export function NuevoUsuarioButton({ roles }: { roles: Rol[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nueva usuario
      </Button>
      <UsuarioFormDialog open={open} onOpenChange={setOpen} roles={roles} />
    </>
  );
}
