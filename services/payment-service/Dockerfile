FROM node:20-alpine

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/payment-service/package.json ./services/payment-service/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=payment-service --include-workspace-root=false --ignore-scripts

COPY shared ./shared
COPY services/payment-service ./services/payment-service

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/payment-service

EXPOSE 3002

CMD ["npm", "run", "dev"]
