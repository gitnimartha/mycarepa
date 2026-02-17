# Multi-stage build for My Care Personal Assistant Pricing App
# Stage 1: Build the React frontend
FROM node:22-alpine AS builder

RUN apk update && \
    apk add --no-cache \
      build-base \
      dos2unix \
      git \
      python3 && \
    ln -sf python3 /usr/bin/python

WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package.json ./
COPY package-lock.json* ./
COPY yarn.lock* ./

# Install dependencies
RUN if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    else \
      npm ci; \
    fi

# Copy source files
COPY . .

# Build arguments for environment configuration
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_API_URL
ARG NODE_ENV=production

# Build the frontend
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine AS production

RUN apk update && \
    apk add --no-cache \
      tzdata \
      dos2unix && \
    npm install -g pm2

WORKDIR /usr/src/app

# Copy docker entrypoint
COPY docker-entrypoint.sh .
RUN dos2unix docker-entrypoint.sh && \
    chmod +x docker-entrypoint.sh

# Copy package files and install production dependencies only
COPY package.json ./
COPY package-lock.json* ./
COPY yarn.lock* ./

RUN if [ -f yarn.lock ]; then \
      yarn install --production --frozen-lockfile; \
    else \
      npm ci --only=production; \
    fi

# Copy built frontend from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy server files
COPY server.js ./
COPY ecosystem.config.cjs ./

# Build metadata
ARG LAST_COMMIT_HASH
RUN echo ${LAST_COMMIT_HASH:-"unknown"} > ./dist/commit.txt

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV TZ=America/Los_Angeles

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/prices || exit 1

EXPOSE 3001

ENTRYPOINT ["sh", "-c", "./docker-entrypoint.sh"]
