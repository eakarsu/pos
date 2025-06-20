FROM node:18-alpine

# Install curl for health checks and openssl for Prisma
RUN apk add --no-cache curl openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies and tsx globally
RUN npm ci && npm install -g tsx

# Copy source code
COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build


# Keep dev dependencies for tsx and other tools, just clean cache
RUN npm cache clean --force

# Create uploads directory
RUN mkdir -p uploads

# Copy frontend source
COPY frontend ./frontend

# Make start scripts executable (as root before switching users)
RUN chmod +x ./scripts/docker-start.sh ./scripts/start.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app

USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./data/pos.db"
ENV JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
ENV JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
ENV CORS_ORIGIN="http://localhost:5173"
ENV API_VERSION=1

# Create data directory for SQLite
RUN mkdir -p data

# Expose ports for both backend and frontend
EXPOSE 3000 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["./scripts/docker-start.sh"]

