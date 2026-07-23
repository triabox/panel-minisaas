-- CreateTable
CREATE TABLE "RateLimit" (
    "clave" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 1,
    "ventanaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("clave")
);
