#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 POS System Requirements Check${NC}"
echo "=================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check version
check_version() {
    local cmd=$1
    local min_version=$2
    local current_version=$3
    
    if [ "$(printf '%s\n' "$min_version" "$current_version" | sort -V | head -n1)" = "$min_version" ]; then
        echo -e "${GREEN}✅ $cmd: $current_version (>= $min_version)${NC}"
        return 0
    else
        echo -e "${RED}❌ $cmd: $current_version (requires >= $min_version)${NC}"
        return 1
    fi
}

REQUIREMENTS_MET=true

# Check Node.js
echo -e "\n${BLUE}📋 Checking Node.js...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    if ! check_version "Node.js" "18.0.0" "$NODE_VERSION"; then
        REQUIREMENTS_MET=false
    fi
else
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}   Install from: https://nodejs.org/${NC}"
    REQUIREMENTS_MET=false
fi

# Check npm
echo -e "\n${BLUE}📋 Checking npm...${NC}"
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    if ! check_version "npm" "8.0.0" "$NPM_VERSION"; then
        REQUIREMENTS_MET=false
    fi
else
    echo -e "${RED}❌ npm is not installed${NC}"
    REQUIREMENTS_MET=false
fi

# Check PostgreSQL
echo -e "\n${BLUE}📋 Checking PostgreSQL...${NC}"
if command_exists psql; then
    PSQL_VERSION=$(psql --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✅ PostgreSQL: $PSQL_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL command line tools not found${NC}"
    echo -e "${YELLOW}   Make sure PostgreSQL is running on localhost:5432${NC}"
fi

# Check if PostgreSQL is running
echo -e "\n${BLUE}📋 Checking PostgreSQL connection...${NC}"
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running on localhost:5432${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
    echo -e "${YELLOW}   Start PostgreSQL service:${NC}"
    echo -e "${YELLOW}   - macOS: brew services start postgresql${NC}"
    echo -e "${YELLOW}   - Linux: sudo systemctl start postgresql${NC}"
    echo -e "${YELLOW}   - Windows: net start postgresql${NC}"
    REQUIREMENTS_MET=false
fi

# Check project files
echo -e "\n${BLUE}📋 Checking project files...${NC}"

if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ Backend package.json found${NC}"
else
    echo -e "${RED}❌ Backend package.json not found${NC}"
    REQUIREMENTS_MET=false
fi

if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✅ Frontend package.json found${NC}"
else
    echo -e "${RED}❌ Frontend package.json not found${NC}"
    REQUIREMENTS_MET=false
fi

if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✅ Prisma schema found${NC}"
else
    echo -e "${RED}❌ Prisma schema not found${NC}"
    REQUIREMENTS_MET=false
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
elif [ -f ".env.example" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, but .env.example exists${NC}"
    echo -e "${YELLOW}   Run: cp .env.example .env${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    REQUIREMENTS_MET=false
fi

# Check ports
echo -e "\n${BLUE}📋 Checking ports...${NC}"
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo -e "${YELLOW}   Kill process: lsof -ti :3000 | xargs kill -9${NC}"
else
    echo -e "${GREEN}✅ Port 3000 is available${NC}"
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5173 is already in use${NC}"
    echo -e "${YELLOW}   Kill process: lsof -ti :5173 | xargs kill -9${NC}"
else
    echo -e "${GREEN}✅ Port 5173 is available${NC}"
fi

# Summary
echo -e "\n${BLUE}📋 Summary${NC}"
echo "=================================="
if [ "$REQUIREMENTS_MET" = true ]; then
    echo -e "${GREEN}🎉 All requirements met! You can start the POS system.${NC}"
    echo -e "${BLUE}   Run: ./scripts/start.sh${NC}"
else
    echo -e "${RED}❌ Some requirements are not met. Please fix the issues above.${NC}"
fi
