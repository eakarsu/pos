FROM node:18-slim

# Install required packages for Prisma and the application
RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    ca-certificates \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g nodemon tsx vite
# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies and tsx globally
RUN npm ci && npm install -g tsx@latest

# Copy source code
COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts
COPY .env .

# Build the application first
RUN npm run build

# Keep dev dependencies for tsx and other tools, just clean cache
RUN npm cache clean --force

# Create uploads directory
RUN mkdir -p uploads

# Copy frontend source
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install

# Go back to app root and copy all source
WORKDIR /app


# Make start scripts executable (as root before switching users)
RUN chmod +x ./scripts/docker-start.sh ./scripts/start.sh


# Expose ports for both backend and frontend
EXPOSE 3000 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["./scripts/docker-start.sh"]

