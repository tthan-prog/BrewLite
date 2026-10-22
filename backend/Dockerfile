# Backend NestJS + Prisma 7 - build nhiều giai đoạn.
# Node >= 24.15 (khớp .nvmrc); xem README mục Môi trường.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
# Tạo Prisma client (src/generated/prisma nằm trong .gitignore nên phải sinh lại khi build).
# DATABASE_URL giả chỉ để file cấu hình đọc được; generate không kết nối CSDL.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    npx prisma generate --config prisma7.config.ts
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Giữ đủ node_modules (gồm prisma CLI) để chạy migrate khi khởi động.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# seed.ts import client từ src/generated/prisma nên cần giữ thư mục này trong image.
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/prisma7.config.ts /app/package.json ./
EXPOSE 3001
# Áp dụng migration rồi chạy server. KHÔNG seed tự động vì seed.ts xoá sạch dữ liệu.
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma7.config.ts && node dist/main.js"]
