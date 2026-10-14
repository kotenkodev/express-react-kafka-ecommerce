# Stage 1: Build Vite React App
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY web/package.json ./web/package.json
RUN npm ci --workspace=@ecommerce/shared --workspace=ecommerce-web --include-workspace-root=false --ignore-scripts

COPY shared ./shared
COPY web ./web
RUN npm run build --workspace=@ecommerce/shared
RUN npm run build --workspace=ecommerce-web

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration for React SPA & API Gateway proxy
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output to Nginx webroot
COPY --from=builder /app/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
