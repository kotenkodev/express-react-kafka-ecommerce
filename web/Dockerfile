# Stage 1: Build Vite React App
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/

RUN npm ci

COPY apps/frontend ./apps/frontend

# Якщо фронтенд залежить від shared типів, скопіюйте їх сюди

RUN cd apps/frontend && npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Копіюємо кастомний конфіг Nginx для підтримки React Router (Fallback на index.html)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Копіюємо збірку Vite в Nginx
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]