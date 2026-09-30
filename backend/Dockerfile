FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install -g npm@11 && npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
# Apply pending migrations, then start. (In a larger setup migrations would run
# as a separate release step before new instances roll out.)
CMD ["sh", "-c", "npx typeorm migration:run -d dist/database/data-source.js && node dist/main.js"]
