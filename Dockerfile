# Stage 1: Base image
FROM oven/bun:1-alpine AS base
WORKDIR /usr/src/app

# Stage 2: Install dependencies
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock* /temp/prod/
RUN cd /temp/prod && (bun install --production --frozen-lockfile || bun install --production)

# Stage 3: Release / Production Image
FROM base AS release

# Copy production node_modules and project source files
COPY --from=install --chown=bun:bun /temp/prod/node_modules ./node_modules
COPY --chown=bun:bun package.json tsconfig.json ./
COPY --chown=bun:bun src ./src

# Set user to non-root
USER bun

# Expose port (default 3000)
EXPOSE 3000/tcp

ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Run server
CMD ["bun", "run", "src/index.ts"]
