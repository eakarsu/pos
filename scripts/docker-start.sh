#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 POS System Docker Startup${NC}"
echo "=================================="

# Check if database exists and is accessible
echo -e "\n${BLUE}🗄️  Checking database...${NC}"
if npx prisma db push --accept-data-loss >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database ready${NC}"
else
    echo -e "${YELLOW}⚠️  Database not ready, initializing...${NC}"
    npx prisma db push --force-reset
    npm run db:seed
    echo -e "${GREEN}✅ Database initialized${NC}"
fi

# Start the application
echo -e "\n${BLUE}🚀 Starting POS System...${NC}"
echo -e "${GREEN}✅ Server starting on port ${PORT:-3000}${NC}"

# Start the Node.js application
exec node dist/server.js
