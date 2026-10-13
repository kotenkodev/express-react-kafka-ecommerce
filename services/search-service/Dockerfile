FROM node:20-alpine

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/search-service/package.json ./services/search-service/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=search-service --include-workspace-root=false --ignore-scripts

COPY shared ./shared
COPY services/search-service ./services/search-service

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/search-service

EXPOSE 3005

CMD ["npm", "run", "dev"]
