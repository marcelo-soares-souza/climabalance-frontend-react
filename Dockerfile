ARG BUILD_VERSION=development
ARG BUILD_TIMESTAMP

# --- Stage 1: Build ---
FROM oven/bun:latest AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_API_URL left empty so requests go to same origin (/api/v1)
# Nginx will proxy /api to the backend service
ARG VITE_MAPBOX_TOKEN=
ARG VITE_STRIPE_PUBLISHABLE_KEY=
ENV VITE_API_URL= \
    VITE_MAPBOX_TOKEN=${VITE_MAPBOX_TOKEN} \
    VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}

ARG BUILD_VERSION
ARG BUILD_TIMESTAMP

RUN bun run build

# Generate version.json
RUN timestamp="${BUILD_TIMESTAMP:-$(date +%s)}"; \
    printf '{"buildId":"%s","timestamp":%s}\n' "${BUILD_VERSION}" "${timestamp}" > /app/dist/version.json

# --- Stage 2: Serve ---
FROM nginxinc/nginx-unprivileged:1.27-alpine

USER root
RUN apk add --no-cache apache2-utils
USER nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
