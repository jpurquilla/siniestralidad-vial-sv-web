# Etapa 1: build de producción reproducible (npm ci respeta package-lock.json).
FROM node:22-alpine AS build
WORKDIR /app

# Usar la version de npm definida por el proyecto
RUN npm install -g npm@11.6.2

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# Etapa 2: servidor estático con fallback de SPA.
FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/siniestralidad-vial-sv-web/browser /usr/share/nginx/html
EXPOSE 80
