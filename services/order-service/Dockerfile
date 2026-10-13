FROM node:20-alpine

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/order-service/package.json ./services/order-service/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=order-service --include-workspace-root=false --ignore-scripts

COPY shared ./shared
COPY services/order-service ./services/order-service

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/order-service

EXPOSE 3001

CMD ["npm", "run", "dev"]
