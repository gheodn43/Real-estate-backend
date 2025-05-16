FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm prune --production
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=build /app /app
EXPOSE 4000
CMD ["node", "src/index.js"]
