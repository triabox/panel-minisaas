-- CreateEnum
CREATE TYPE "EstadoMejora" AS ENUM ('pendiente', 'habilitada', 'entregada');

-- CreateEnum
CREATE TYPE "EstadoProspecto" AS ENUM ('contactado', 'demo', 'prueba', 'cerrado', 'descartado');

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "fechaPrimerPago" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ConfiguracionCapacidad" ADD COLUMN     "mesesEntreMejoras" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "Mejora" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoMejora" NOT NULL DEFAULT 'pendiente',
    "fechaHabilitacion" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mejora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prospecto" (
    "id" TEXT NOT NULL,
    "negocio" TEXT NOT NULL,
    "rubroId" TEXT,
    "contactoNombre" TEXT,
    "contactoEmail" TEXT,
    "contactoTelefono" TEXT,
    "direccion" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "estado" "EstadoProspecto" NOT NULL DEFAULT 'contactado',
    "fechaRecordatorio" TIMESTAMP(3),
    "notas" TEXT,
    "origen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectoEvento" (
    "id" TEXT NOT NULL,
    "prospectoId" TEXT NOT NULL,
    "estado" "EstadoProspecto" NOT NULL,
    "horas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nota" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mejora_clienteId_idx" ON "Mejora"("clienteId");

-- CreateIndex
CREATE INDEX "Mejora_estado_idx" ON "Mejora"("estado");

-- CreateIndex
CREATE INDEX "Prospecto_negocio_idx" ON "Prospecto"("negocio");

-- CreateIndex
CREATE INDEX "Prospecto_estado_idx" ON "Prospecto"("estado");

-- CreateIndex
CREATE INDEX "Prospecto_fechaRecordatorio_idx" ON "Prospecto"("fechaRecordatorio");

-- CreateIndex
CREATE INDEX "ProspectoEvento_prospectoId_idx" ON "ProspectoEvento"("prospectoId");

-- AddForeignKey
ALTER TABLE "Mejora" ADD CONSTRAINT "Mejora_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospecto" ADD CONSTRAINT "Prospecto_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "Rubro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectoEvento" ADD CONSTRAINT "ProspectoEvento_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES "Prospecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
