# syntax=docker/dockerfile:1
# Frontend: nginx + Vite build

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/
# Must include optional deps; Rollup needs @rollup/rollup-linux-x64-musl on Alpine
RUN npm ci --include=dev 2>/dev/null || npm install --include=dev
RUN npm install @rollup/rollup-linux-x64-musl --no-save

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY tailwind.config.js postcss.config.js ./
COPY public ./public
COPY src ./src

ENV VITE_BASE_PATH=/
RUN npx vite build

FROM nginx:1.27-alpine AS production
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
RUN apk add --no-cache wget
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
