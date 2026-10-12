# Stage 1: Build Vite React App
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration for React SPA & API Gateway proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output to Nginx webroot
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]