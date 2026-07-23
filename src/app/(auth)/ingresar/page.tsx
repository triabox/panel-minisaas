import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/ui/card";
import { auth } from "@/core/auth";
import { APP_NAME } from "@/core/lib/branding";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Ingresar",
};

export default async function IngresarPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/inicio");
  }

  return (
    <div className="w-full max-w-md">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary-700"
      >
        ← Volver al inicio
      </Link>

      <Card className="border-primary-100 shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
            PG
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl leading-tight">{APP_NAME}</CardTitle>
            <CardDescription>
              Usá tu email y contraseña para acceder al sistema.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Si tenés problemas para ingresar, comunicate con la administración.
      </p>
    </div>
  );
}
