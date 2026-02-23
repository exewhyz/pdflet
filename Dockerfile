# ── Stage 1: Build ──────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npx tsc

# ── Stage 2: Production ────────────────────────────
FROM node:20-slim

# Puppeteer / Chromium system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  wget \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

WORKDIR /app

# Only copy production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy compiled JS and templates
COPY --from=builder /app/dist ./dist
COPY src/templates ./dist/templates

# Download Chromium for Puppeteer at build time
RUN npx puppeteer browsers install chrome

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
