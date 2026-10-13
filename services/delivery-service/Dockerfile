FROM node:20-alpine

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/delivery-service/package.json ./services/delivery-service/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=delivery-service --include-workspace-root=false --ignore-scripts

COPY shared ./shared
COPY services/delivery-service ./services/delivery-service

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/delivery-service

EXPOSE 3003

CMD ["npm", "run", "dev"]
