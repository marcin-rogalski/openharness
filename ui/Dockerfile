FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY libs/fetch/package.json ./libs/fetch/
COPY libs/contracts/package.json ./libs/contracts/
COPY ui/package.json ./ui/
RUN npm ci

COPY libs/fetch ./libs/fetch
COPY libs/contracts ./libs/contracts
COPY ui ./ui

RUN npm run build -w @openharness/ui

FROM nginx:alpine

COPY --from=build /app/ui/dist /usr/share/nginx/html
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
