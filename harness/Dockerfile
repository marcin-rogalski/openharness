FROM node:24-alpine AS build

WORKDIR /app

COPY libs/tempo ./libs/tempo
COPY harness ./harness

RUN cd /app/libs/tempo && npm ci && cd /app/harness && npm ci && npm run build

FROM node:24-alpine

ENV NODE_ENV=production
ENV HARNESS_PORT=3000
ENV PROJECTS_DIR=/projects

WORKDIR /app

COPY --from=build /app/harness/dist ./dist

EXPOSE 3000
VOLUME ["/projects"]

CMD ["node", "dist/index.js"]
