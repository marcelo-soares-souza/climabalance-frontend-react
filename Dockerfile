ARG BUILD_VERSION=development
ARG BUILD_TIMESTAMP

# --- Stage 1: Build ---
FROM oven/bun:latest-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_API_URL left empty so requests go to same origin (/api/v1)
# Nginx will proxy /api to the backend service
ENV VITE_API_URL=

ARG BUILD_VERSION
ARG BUILD_TIMESTAMP

# Source VITE_ env vars from .env (except VITE_API_URL which must be empty for production)
RUN if [ -f .env ]; then export $(grep '^VITE_' .env | grep -v '^VITE_API_URL' | xargs); fi && bun run build

# Generate version.json
RUN if [ -z "$BUILD_TIMESTAMP" ]; then BUILD_TIMESTAMP=$(date +%s); fi && \
    echo "{\"buildId\":\"${BUILD_VERSION}\",\"timestamp\":${BUILD_TIMESTAMP}}" > /app/dist/version.json

# --- Stage 2: Serve ---
FROM nginx:1.30-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
