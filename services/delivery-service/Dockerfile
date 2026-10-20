# --------------------------------------------------
# Stage 1: Base (system deps & npm dependencies)
# --------------------------------------------------
FROM node:20-alpine AS base

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/delivery-service/package.json ./services/delivery-service/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=delivery-service --include-workspace-root=false --ignore-scripts

# --------------------------------------------------
# Stage 2: Development (hot-reloading with tsx)
# --------------------------------------------------
FROM base AS dev

RUN npm install @esbuild/linux-x64

COPY shared ./shared
COPY services/delivery-service ./services/delivery-service

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/delivery-service
EXPOSE 3003
CMD ["npm", "run", "dev"]

# --------------------------------------------------
# Stage 3: Builder (TypeScript compile & prune)
# --------------------------------------------------
FROM base AS builder

COPY shared ./shared
COPY services/delivery-service ./services/delivery-service

RUN npm run build --workspace=@ecommerce/shared
RUN npm run build --workspace=delivery-service
RUN npm prune --omit=dev --workspace=@ecommerce/shared --workspace=delivery-service --include-workspace-root=false --ignore-scripts
RUN npm run db:generate --workspace=@ecommerce/shared
RUN mkdir -p services/delivery-service/node_modules

# --------------------------------------------------
# Stage 4: Production (minimal runtime)
# --------------------------------------------------
FROM node:20-alpine AS prod

RUN apk add --no-cache openssl
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/services/delivery-service/node_modules ./services/delivery-service/node_modules
COPY --from=builder /app/services/delivery-service/package.json ./services/delivery-service/package.json
COPY --from=builder /app/services/delivery-service/dist ./services/delivery-service/dist

USER node
WORKDIR /app/services/delivery-service
EXPOSE 3003
CMD ["node", "dist/index.js"]
