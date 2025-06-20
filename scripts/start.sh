#!/bin/sh

# --- Configuration ---
BACKEND_PORT=3000
FRONTEND_PORT=5173

# --- Colors for beautiful output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 POS System Smart Startup Script${NC}"
echo "=================================="

# --- Helper Functions ---
# Checks for a command, silent on failure
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Kills processes using a specific port, using 'ss' or 'netstat' as lsof is not available
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔍 Searching for process on port $port...${NC}"
    # Use ss, which is common in modern containers. Grep for the PID.
    local pid=$(ss -ltnp "sport = :$port" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -n 1)

    if [ -z "$pid" ]; then
        # Fallback to netstat if ss fails or doesn't find it
        pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | grep -v '-')
    fi

    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️ Killing existing process on port $port (PID: $pid)${NC}"
        kill -9 "$pid"
        # Wait for the OS to release the port
        sleep 3
    else
        echo -e "${GREEN}✅ Port $port is free.${NC}"
    fi
}

# --- Main Execution ---

# 1. Environment and Requirement Checks
echo -e "\n${BLUE}📋 Phase 1: Checking Environment...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found. Please create one from .env.example.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .env file found.${NC}"
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✅ npm: $(npm --version)${NC}"

# 2. Prisma and Database Setup (Do this BEFORE installing dependencies)
echo -e "\n${BLUE}🗄️ Phase 2: Setting up Database...${NC}"
echo "   Generating Prisma Client..."
if npx prisma generate; then
    echo -e "${GREEN}✅ Prisma client generated successfully.${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client.${NC}"
    exit 1
fi

echo "   Checking database connectivity and schema..."
if npx prisma db push --accept-data-loss; then
    echo -e "${GREEN}✅ Database schema is up to date.${NC}"
else
    echo -e "${RED}❌ Could not connect to database or push schema.${NC}"
    exit 1
fi

# 3. Install Dependencies (Only if node_modules is missing)
echo -e "\n${BLUE}📦 Phase 3: Installing Dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "   Backend node_modules not found. Installing..."
    npm install
else
    echo "   Backend node_modules already exists. Skipping install."
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "   Frontend node_modules not found. Installing..."
    cd frontend && npm install && cd ..
else
    echo "   Frontend node_modules already exists. Skipping install."
fi

# 4. Clean Up Old Processes
echo -e "\n${BLUE}🧹 Phase 4: Cleaning Up Old Processes...${NC}"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
pkill -f nodemon 2>/dev/null || true
pkill -f vite 2>/dev/null || true

# 5. Start Services
echo -e "\n${BLUE}🚀 Phase 5: Starting Services...${NC}"

# Use 'npm start' for production/stability, 'npm run dev' for development.
# For this script, we'll use 'dev' as per your setup.
echo "   Starting backend server..."
npm run dev &
BACKEND_PID=$!

echo "   Waiting for backend to initialize (10 seconds)..."
sleep 10

if ! kill -0 $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend server failed to start. Check logs for errors.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend process is running.${NC}"


echo "   Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "   Waiting for frontend to initialize (10 seconds)..."
sleep 10

if ! kill -0 $FRONTEND_PID > /dev/null 2>&1; then
    echo -e "${RED}❌ Frontend server failed to start. Check logs for errors.${NC}"
    kill $BACKEND_PID
    exit 1
fi
echo -e "${GREEN}✅ Frontend process is running.${NC}"


# --- Final Status ---
echo -e "\n${GREEN}🎉 POS System started successfully!${NC}"
echo "=================================="
echo -e "${BLUE}📱 Frontend available at:${NC} http://localhost:${FRONTEND_PORT}"
echo -e "${BLUE}🔧 Backend API available at:${NC} http://localhost:${BACKEND_PORT}"
echo ""
echo -e "${YELLOW}⚠️ Press Ctrl+C to stop all servers.${NC}"

# --- Cleanup on Exit ---
cleanup() {
    echo -e "\n\n${YELLOW}🛑 Shutting down all services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Done.${NC}"
    exit 0
}

trap cleanup INT
wait

