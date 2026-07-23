import Link from "next/link";
import { notFound } from "next/navigation";
import { Layers, Gauge, UserCog } from "lucide-react";

import { auth } from "@/core/auth";
import { esSuperAdmin, tieneRolGestion } from "@/core/permisos";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/ui/card";

export const metadata = { title: "Configuración" };

const SECCIONES = [
  {
    href: "/configuracion/rubros",
    titulo: "Rubros",
    descripcion: "Catálogo configurable con el que clasificás a tus clientes.",
    icono: Layers,
    soloSuperAdmin: false,
  },
  {
    href: "/configuracion/capacidad",
    titulo: "Capacidad",
    descripcion:
      "Horas de soporte y clientes objetivo. Define el umbral de horas por cliente.",
    icono: Gauge,
    soloSuperAdmin: false,
  },
  {
    href: "/usuarios",
    titulo: "Usuarios y accesos",
    descripcion: "Cuentas, roles y restablecimiento de contraseñas.",
    icono: UserCog,
    soloSuperAdmin: true,
  },
];

export default async function ConfiguracionPage() {
  const session = await auth();
  const roles = session?.user.roles ?? [];
  if (!tieneRolGestion(roles)) notFound();

  const visibles = SECCIONES.filter(
    (s) => !s.soloSuperAdmin || esSuperAdmin(roles),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary-900">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Catálogos y ajustes del panel.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((s) => {
          const Icon = s.icono;
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary-300">
                <CardHeader>
                  <div className="mb-1 inline-flex size-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-base">{s.titulo}</CardTitle>
                  <CardDescription>{s.descripcion}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
