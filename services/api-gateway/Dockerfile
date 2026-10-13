FROM node:20-alpine

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/api-gateway/package.json ./services/api-gateway/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=api-gateway --include-workspace-root=false --ignore-scripts

COPY shared ./shared
COPY services/api-gateway ./services/api-gateway

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/api-gateway

EXPOSE 8000

CMD ["npm", "run", "dev"]
