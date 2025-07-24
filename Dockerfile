# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY ./ui ./
RUN npm install && npm run build

# Stage 2: Nginx to serve the frontend
FROM nginx:stable-alpine
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html