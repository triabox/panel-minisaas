import Link from "next/link";

import { APP_INICIALES, APP_NAME, INSTITUCION_NOMBRE } from "@/core/lib/branding";
import { Button } from "@/core/ui/button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-primary-50 via-white to-accent-50 px-6 text-center">
      <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white">
        {APP_INICIALES}
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary-900">
          {APP_NAME}
        </h1>
        <p className="text-sm text-muted-foreground">{INSTITUCION_NOMBRE}</p>
      </div>
      <Button asChild size="lg">
        <Link href="/ingresar">Ingresar</Link>
      </Button>
    </main>
  );
}
