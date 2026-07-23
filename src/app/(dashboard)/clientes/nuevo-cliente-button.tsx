"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/core/ui/button";
import { ClienteFormDialog, type EtiquetaOption } from "./cliente-form-dialog";

export function NuevoClienteButton({
  etiquetas,
}: {
  etiquetas: EtiquetaOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nuevo cliente
      </Button>
      <ClienteFormDialog open={open} onOpenChange={setOpen} etiquetas={etiquetas} />
    </>
  );
}
