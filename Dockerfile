# Deploy determinístico (evita los límites del nixpkgs fijo de Nixpacks:
# no tiene Node 24, y su Node 22 es 22.11 < 22.12 que exige Prisma 7).
FROM node:22-bookworm-slim

# Prisma necesita openssl en runtime y para generate.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencias primero (mejor cache). Usamos `npm install` (no `npm ci`)
# porque el package-lock.json tiene drift en deps nativas opcionales @emnapi.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund

# Resto del código.
COPY . .

# Env necesarias en BUILD (Easypanel las inyecta como --build-arg).
# Las NEXT_PUBLIC_* se inlinean en el bundle; DATABASE_URL/AUTH_SECRET las
# valida core/lib/env.ts al compilar.
ARG DATABASE_URL
ARG DIRECT_URL
ARG AUTH_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME="Panel MiniSaaS"
ARG NEXT_PUBLIC_INSTITUCION_NOMBRE="Panel MiniSaaS"
ARG STORAGE_DRIVER=local
ARG STORAGE_LOCAL_DIR=/data/uploads
ENV DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    AUTH_SECRET=$AUTH_SECRET \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_INSTITUCION_NOMBRE=$NEXT_PUBLIC_INSTITUCION_NOMBRE \
    STORAGE_DRIVER=$STORAGE_DRIVER \
    STORAGE_LOCAL_DIR=$STORAGE_LOCAL_DIR

RUN npm run build

EXPOSE 3000
# start:prod = prisma migrate deploy && tsx prisma/seed.ts && next start -H 0.0.0.0
CMD ["npm", "run", "start:prod"]
