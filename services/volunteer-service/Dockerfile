FROM node:20-alpine AS deps
WORKDIR /app


COPY package-lock.json ./
COPY services/volunteer-service/package.json ./package.json

RUN npm ci --only=production


FROM node:20-alpine
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules


COPY services/volunteer-service/ .

EXPOSE 3006
CMD ["node", "src/index.js"]
