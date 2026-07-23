"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/core/ui/button";
import { EtiquetaFormDialog } from "./etiqueta-form-dialog";

export function NuevaEtiquetaButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nueva etiqueta
      </Button>
      <EtiquetaFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
