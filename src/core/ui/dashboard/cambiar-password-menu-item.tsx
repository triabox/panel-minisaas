"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

import { DropdownMenuItem } from "@/core/ui/dropdown-menu";

import { CambiarPasswordDialog } from "./cambiar-password-dialog";

export function CambiarPasswordMenuItem() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer"
      >
        <KeyRound className="size-4" />
        Cambiar contraseña
      </DropdownMenuItem>
      <CambiarPasswordDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
