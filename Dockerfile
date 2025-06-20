FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build


# Clean up dev dependencies to reduce image size
RUN npm ci --omit=dev && npm cache clean --force

# Create uploads directory
RUN mkdir -p uploads

# Copy and make start scripts executable
RUN chmod +x ./scripts/start.sh ./scripts/docker-start.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app

USER nextjs

# Copy frontend source
COPY frontend ./frontend

# Expose ports for both backend and frontend
EXPOSE 3000 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["./scripts/docker-start.sh"]

