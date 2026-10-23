# Frontend Next.js - build nhiều giai đoạn.
# NEXT_PUBLIC_API_URL được gắn vào lúc BUILD, nên truyền qua build arg.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3000
# PORT do nền tảng cấp (Render, v.v.); mặc định 3000 khi chạy local.
CMD ["sh", "-c", "npx next start -p ${PORT:-3000}"]
