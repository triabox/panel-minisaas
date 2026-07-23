import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/ui/card";

import { RecuperoForm } from "./recupero-form";

export const metadata = {
  title: "Recuperar contraseña",
};

export default function RecuperarPage() {
  return (
    <div className="w-full max-w-md">
      <Link
        href="/ingresar"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary-700"
      >
        ← Volver al ingreso
      </Link>

      <Card className="border-primary-100 shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
          <CardDescription>
            Te enviamos un enlace al email registrado. Funciona por 30 minutos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecuperoForm />
        </CardContent>
      </Card>
    </div>
  );
}
