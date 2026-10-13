FROM node:20-alpine

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/product-service/package.json ./services/product-service/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=product-service --include-workspace-root=false --ignore-scripts

COPY shared ./shared
COPY services/product-service ./services/product-service

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/product-service

EXPOSE 3007

CMD ["npm", "run", "dev"]
