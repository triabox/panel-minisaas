"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/core/ui/button";
import { ProspectoFormDialog, type RubroOpt } from "./prospecto-form-dialog";

export function NuevoProspectoButton({ rubros }: { rubros: RubroOpt[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nuevo prospecto
      </Button>
      <ProspectoFormDialog open={open} onOpenChange={setOpen} rubros={rubros} />
    </>
  );
}
