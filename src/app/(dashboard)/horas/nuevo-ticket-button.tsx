"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/core/ui/button";
import { TicketFormDialog } from "./ticket-form-dialog";

export function NuevoTicketButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Cargar horas
      </Button>
      <TicketFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
