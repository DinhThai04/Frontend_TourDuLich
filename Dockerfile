# ----- Giai đoạn 1: Build ứng dụng React -----
   FROM node:20-alpine AS builder
   WORKDIR /app
   
   COPY package.json ./
   RUN npm install
   
   COPY . .
   
   # --- THÊM DÒNG NÀY ---
   # Tăng giới hạn bộ nhớ cho Node lên 4GB (để nó tự tin dùng Swap)
   ENV NODE_OPTIONS="--max-old-space-size=4096"
   
   RUN npm run build
   
   # ----- Giai đoạn 2: Serve bằng Nginx -----
   FROM nginx:1.25-alpine
   COPY --from=builder /app/dist /usr/share/nginx/html

   # Xóa config mặc định
   RUN rm /etc/nginx/conf.d/default.conf
   # Copy file config xịn của bạn vào
   COPY nginx.conf /etc/nginx/conf.d/default.conf

   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
