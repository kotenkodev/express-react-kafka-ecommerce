FROM node:20-alpine

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/auth-service/package.json ./services/auth-service/package.json

RUN npm ci --workspace=@ecommerce/shared --workspace=auth-service --include-workspace-root=false --ignore-scripts

COPY shared ./shared
COPY services/auth-service ./services/auth-service

RUN npm run build --workspace=@ecommerce/shared

WORKDIR /app/services/auth-service

EXPOSE 3006

CMD ["npm", "run", "dev"]
