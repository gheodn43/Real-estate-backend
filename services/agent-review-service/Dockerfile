# ==== Build Stage ====
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm prune --production
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app /app
EXPOSE 4004
CMD ["node", "src/index.js"]
