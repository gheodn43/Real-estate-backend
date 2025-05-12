    FROM node:18-alpine as build
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci
    COPY . .
    RUN npx prisma generate
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY --from=build /app /app
    EXPOSE 4001
    CMD ["node", "src/index.js"]
    