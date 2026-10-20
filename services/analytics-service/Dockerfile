# --------------------------------------------------
# Stage 1: Base (system deps & npm dependencies)
# --------------------------------------------------
FROM node:20-alpine AS base

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/analytics-service/package.json ./services/analytics-service/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=analytics-service --include-workspace-root=false --ignore-scripts

# --------------------------------------------------
# Stage 2: Development (hot-reloading with tsx)
# --------------------------------------------------
FROM base AS dev

COPY shared ./shared
COPY services/analytics-service ./services/analytics-service

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/analytics-service
EXPOSE 3004
CMD ["npm", "run", "dev"]

# --------------------------------------------------
# Stage 3: Builder (TypeScript compile & prune)
# --------------------------------------------------
FROM base AS builder

COPY shared ./shared
COPY services/analytics-service ./services/analytics-service

RUN npm run build --workspace=@ecommerce/shared
RUN npm run build --workspace=analytics-service
RUN npm prune --omit=dev --workspace=@ecommerce/shared --workspace=analytics-service --include-workspace-root=false --ignore-scripts
RUN npm run db:generate --workspace=@ecommerce/shared
RUN mkdir -p services/analytics-service/node_modules

# --------------------------------------------------
# Stage 4: Production (minimal runtime)
# --------------------------------------------------
FROM node:20-alpine AS prod

RUN apk add --no-cache openssl
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/services/analytics-service/node_modules ./services/analytics-service/node_modules
COPY --from=builder /app/services/analytics-service/package.json ./services/analytics-service/package.json
COPY --from=builder /app/services/analytics-service/dist ./services/analytics-service/dist

USER node
WORKDIR /app/services/analytics-service
EXPOSE 3004
CMD ["node", "dist/index.js"]
