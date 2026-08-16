FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY libs/tempo/package.json ./libs/tempo/
COPY libs/contracts/package.json ./libs/contracts/
COPY libs/fetch/package.json ./libs/fetch/
COPY harness/package.json ./harness/
RUN npm ci

COPY libs/tempo ./libs/tempo
COPY libs/contracts ./libs/contracts
COPY libs/fetch ./libs/fetch
COPY harness ./harness

RUN npm run build -w harness

FROM node:24-alpine

ENV NODE_ENV=production
ENV HARNESS_PORT=3000
ENV PROJECTS_DIR=/projects

WORKDIR /app

COPY --from=build /app/harness/dist ./dist

EXPOSE 3000
VOLUME ["/projects"]

CMD ["node", "dist/index.js"]
