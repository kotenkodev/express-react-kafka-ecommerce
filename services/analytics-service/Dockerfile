FROM node:20-alpine

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/analytics-service/package.json ./services/analytics-service/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=analytics-service --include-workspace-root=false --ignore-scripts

COPY shared ./shared
COPY services/analytics-service ./services/analytics-service

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/analytics-service

EXPOSE 3004

CMD ["npm", "run", "dev"]
