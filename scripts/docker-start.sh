#!/bin/sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 POS System Docker Startup${NC}"
echo "=================================="

# Function to check if a port is in use
port_in_use() {
    netstat -ln | grep ":$1 " >/dev/null 2>&1
}

# Generate Prisma client first (at runtime to avoid build issues)
echo -e "\n${BLUE}🔧 Generating Prisma client...${NC}"
if npx prisma generate >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi

# Check if database exists and is accessible
echo -e "\n${BLUE}🗄️  Checking database...${NC}"
echo -e "${YELLOW}⚠️  Database not ready, initializing...${NC}"
npx prisma db push --force-reset
npx tsx prisma/seed.ts
echo -e "${GREEN}✅ Database initialized${NC}"

./scripts/start.sh
