/*
  Warnings:

  - You are about to drop the column `activo` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the `ClienteEtiqueta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Etiqueta` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fechaAlta` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `negocio` to the `Cliente` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('activo', 'pausado', 'baja');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('al_dia', 'demorado', 'vencido');

-- CreateEnum
CREATE TYPE "TipoTicket" AS ENUM ('bug', 'ajuste', 'feature', 'consulta');

-- DropForeignKey
ALTER TABLE "ClienteEtiqueta" DROP CONSTRAINT "ClienteEtiqueta_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "ClienteEtiqueta" DROP CONSTRAINT "ClienteEtiqueta_etiquetaId_fkey";

-- DropIndex
DROP INDEX "Cliente_nombre_idx";

-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "activo",
DROP COLUMN "email",
DROP COLUMN "nombre",
DROP COLUMN "telefono",
ADD COLUMN     "abonoMensual" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "contactoEmail" TEXT,
ADD COLUMN     "contactoNombre" TEXT,
ADD COLUMN     "contactoTelefono" TEXT,
ADD COLUMN     "estado" "EstadoCliente" NOT NULL DEFAULT 'activo',
ADD COLUMN     "estadoPago" "EstadoPago" NOT NULL DEFAULT 'al_dia',
ADD COLUMN     "fechaAlta" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "negocio" TEXT NOT NULL,
ADD COLUMN     "rubroId" TEXT,
ADD COLUMN     "sistema" TEXT,
ADD COLUMN     "ultimaActividad" TIMESTAMP(3);

-- DropTable
DROP TABLE "ClienteEtiqueta";

-- DropTable
DROP TABLE "Etiqueta";

-- CreateTable
CREATE TABLE "Rubro" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Rubro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoTicket" NOT NULL,
    "descripcion" TEXT,
    "horasHombre" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tiempoIa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "automatizado" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionCapacidad" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "horasSoporteMes" INTEGER NOT NULL DEFAULT 120,
    "clientesObjetivo" INTEGER NOT NULL DEFAULT 60,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionCapacidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rubro_codigo_key" ON "Rubro"("codigo");

-- CreateIndex
CREATE INDEX "Ticket_clienteId_idx" ON "Ticket"("clienteId");

-- CreateIndex
CREATE INDEX "Ticket_fecha_idx" ON "Ticket"("fecha");

-- CreateIndex
CREATE INDEX "Cliente_negocio_idx" ON "Cliente"("negocio");

-- CreateIndex
CREATE INDEX "Cliente_estado_idx" ON "Cliente"("estado");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "Rubro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
