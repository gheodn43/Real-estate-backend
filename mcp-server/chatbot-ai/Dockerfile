FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/
RUN npm ci
COPY . .
RUN npm prune --production
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "src/index.js"]
