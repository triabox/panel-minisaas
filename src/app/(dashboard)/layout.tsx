import { redirect } from "next/navigation";

import { auth, signOut } from "@/core/auth";

import { AppShell } from "./app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/ingresar");

  async function cerrarSesion() {
    "use server";
    await signOut({ redirectTo: "/ingresar" });
  }

  return (
    <AppShell
      nombre={session.user.name ?? ""}
      email={session.user.email ?? ""}
      roles={session.user.roles}
      cerrarSesion={cerrarSesion}
    >
      {children}
    </AppShell>
  );
}
