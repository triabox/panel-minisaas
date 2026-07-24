"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/core/ui/button";
import { MejoraFormDialog } from "./mejora-form-dialog";

export function NuevaMejoraButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nueva mejora
      </Button>
      <MejoraFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
