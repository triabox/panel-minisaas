"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/core/ui/dropdown-menu";

export function LogoutMenuItem({
  cerrarSesion,
}: {
  cerrarSesion: () => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      disabled={isPending}
      onSelect={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await cerrarSesion();
          router.push("/ingresar");
          router.refresh();
        });
      }}
      className="cursor-pointer"
    >
      <LogOut className="size-4" />
      {isPending ? "Cerrando..." : "Cerrar sesión"}
    </DropdownMenuItem>
  );
}
