import { healthHandler } from "@/core/salud/health";

export const dynamic = "force-dynamic";

export async function GET() {
  return healthHandler();
}
