# ── build: compile Vite app ───────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── serve: lightweight nginx ──────────────────────────────────────
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# Store as template; BACKEND_URL is injected at container start via envsubst
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
# Only substitute ${BACKEND_URL} — nginx's own $uri, $http_upgrade etc. are left untouched
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
