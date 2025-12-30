# Base
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /app

# deps
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# development
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/nest-cli.json apps/api/tsconfig*.json ./apps/api/
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]

# build
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
WORKDIR /app/apps/api
RUN pnpm run build

# production
FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /app

# Docker에서는 Husky CI 필요없음
ENV HUSKY=0

# 프로덕션 의존성만 설치
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# 빌드된 파일 복사
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/apps/api/src/main.js"]