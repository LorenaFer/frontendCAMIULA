# ============================================================
# CAMIULA Frontend — Dockerfile multi-stage
#
# Stages:
#   deps     → instala node_modules (cache de capas)
#   dev      → desarrollo local con hot-reload
#   builder  → build de producción (adapter-node para VPS)
#   runner   → imagen final mínima (~node build/index.js)
#
# Adapter strategy:
#   - Vercel:  no usa este Dockerfile. Vercel hace su propio build
#              con VERCEL=1 → adapter-auto → Vercel Output API.
#   - Docker:  el stage builder setea BUILD_TARGET=node →
#              svelte.config.js usa adapter-node explícitamente →
#              genera build/index.js listo para Node.js SSR.
#
# Uso:
#   Desarrollo:        docker compose up frontend-dev
#   VPS (build solo):  docker build --target runner -t camiula-frontend .
#   VPS (compose):     docker compose -f ../docker-compose.prod.yml up
# ============================================================

ARG NODE_VERSION=20-alpine

# ─── Stage 1: deps ───────────────────────────────────────────
# Instala dependencias. Se cachea mientras package*.json no cambie.
FROM node:${NODE_VERSION} AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --prefer-offline


# ─── Stage 2: dev ────────────────────────────────────────────
# Para desarrollo local con hot-reload.
# El código se provee via bind mount en docker-compose.yml.
FROM node:${NODE_VERSION} AS dev

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

EXPOSE 5173

# --host es necesario para que Vite sea accesible fuera del contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ─── Stage 3: builder ────────────────────────────────────────
# Compila para producción usando adapter-node (VPS/Docker).
# BUILD_TARGET=node hace que svelte.config.js elija adapter-node
# en vez de adapter-auto, garantizando el output en build/index.js
# independientemente del entorno de build.
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Activa adapter-node en svelte.config.js
ENV BUILD_TARGET=node

# Genera .svelte-kit/tsconfig.json y tipos
RUN npm run prepare

# Build de producción → genera build/index.js via adapter-node
RUN npm run build


# ─── Stage 4: runner ─────────────────────────────────────────
# Imagen final para VPS. Solo contiene el build compilado.
# Tamaño ~180MB (node:alpine + build + runtime deps).
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
# Puerto por defecto. El compose de producción puede sobreescribirlo.
ENV PORT=3000

# Solo lo necesario para ejecutar el servidor SSR
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000

# adapter-node genera build/index.js como entry point del servidor HTTP
CMD ["node", "build/index.js"]
