"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/core/ui/button";
import { RubroFormDialog } from "./rubro-form-dialog";

export function NuevoRubroButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nuevo rubro
      </Button>
      <RubroFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
