import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/ui/card";

import { RestablecerForm } from "./restablecer-form";

export const metadata = {
  title: "Nueva contraseña",
};

export default async function RestablecerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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
          <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
          <CardDescription>
            Definí una contraseña nueva. Después podés ingresar con ella.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestablecerForm token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
