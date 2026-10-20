# --------------------------------------------------
# Stage 1: Base (dependencies)
# --------------------------------------------------
FROM node:22-alpine AS base

RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY web/package.json ./web/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=ecommerce-web --include-workspace-root=false --ignore-scripts

# --------------------------------------------------
# Stage 2: Development (Vite Dev Server)
# --------------------------------------------------
FROM base AS dev

COPY shared ./shared
COPY web ./web

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/web
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --------------------------------------------------
# Stage 3: Builder (Compile Vite React App)
# --------------------------------------------------
FROM base AS builder

COPY shared ./shared
COPY web ./web

RUN npm run build --workspace=@ecommerce/shared
RUN npm run build --workspace=ecommerce-web

# --------------------------------------------------
# Stage 4: Production (Nginx SPA & API Reverse Proxy)
# --------------------------------------------------
FROM nginx:alpine AS prod

# Copy custom Nginx configuration for React SPA & API Gateway proxy
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output to Nginx webroot
COPY --from=builder /app/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
