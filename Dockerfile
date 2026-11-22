# ----- Giai đoạn 1: Build ứng dụng React (build cục bộ với: npm run build) -----
# FROM --platform=linux/amd64 node:20-alpine AS builder
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm ci
# COPY . .
# ENV NODE_OPTIONS="--max-old-space-size=4096"
# ARG VITE_GOOGLE_CLIENT_ID
# ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
# RUN npm run build

# ----- Giai đoạn 2: Serve bằng Nginx -----
FROM --platform=linux/amd64 nginx:1.25-alpine
COPY dist /usr/share/nginx/html

# Xóa config mặc định
RUN rm /etc/nginx/conf.d/default.conf
# Copy file config xịn của bạn vào
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
