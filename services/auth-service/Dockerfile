FROM node:20-alpine

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3006

CMD ["npm", "run", "dev"]
