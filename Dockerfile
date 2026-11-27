# ----- Giai đoạn 1: Build ứng dụng React (multi-stage build) -----
FROM --platform=linux/amd64 node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# ----- Giai đoạn 2: Serve bằng Nginx -----
FROM --platform=linux/amd64 nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Xóa config mặc định
RUN rm /etc/nginx/conf.d/default.conf
# Copy file config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
