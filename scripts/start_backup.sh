#!/bin/sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 POS System Startup Script${NC}"
echo "=================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Killing existing process on port $port (PID: $pid)${NC}"
        kill -9 $pid
        sleep 2
    fi
}

# Check Node.js
echo -e "\n${BLUE}📋 Checking requirements...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Check PostgreSQL
if command_exists psql; then
    echo -e "${GREEN}✅ PostgreSQL is available${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL command line tools not found${NC}"
    echo -e "${YELLOW}   Make sure PostgreSQL is running on localhost:5432${NC}"
fi

# Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo -e "${YELLOW}   Creating .env file from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
fi

# Check database connection
echo -e "\n${BLUE}🗄️  Checking database connection...${NC}"
if npm run db:generate >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}   Please ensure PostgreSQL is running and DATABASE_URL is correct${NC}"
    exit 1
fi

# Install backend dependencies
echo -e "\n${BLUE}📦 Installing backend dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

# Install frontend dependencies
echo -e "\n${BLUE}📦 Installing frontend dependencies...${NC}"
cd frontend
if npm install; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
cd ..

# Check and kill existing processes
echo -e "\n${BLUE}🔍 Checking for existing processes...${NC}"
if port_in_use 3000; then
    kill_port 3000
fi
if port_in_use 5173; then
    kill_port 5173
fi

# Start backend server
echo -e "\n${BLUE}🚀 Starting backend server...${NC}"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if port_in_use 3000; then
    echo -e "${GREEN}✅ Backend server started on port 3000${NC}"
else
    echo -e "${RED}❌ Backend server failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend server
echo -e "\n${BLUE}🚀 Starting frontend server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
sleep 5

# Check if frontend is running
if port_in_use 5173; then
    echo -e "${GREEN}✅ Frontend server started on port 5173${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo -e "\n${GREEN}🎉 POS System started successfully!${NC}"
echo "=================================="
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:3000"
echo -e "${BLUE}📚 API Docs:${NC} http://localhost:3000/api-docs"
echo -e "${BLUE}🏥 Health Check:${NC} http://localhost:3000/health"
echo ""
echo -e "${YELLOW}📋 Default Login Credentials:${NC}"
echo -e "   Email: admin@pos.com"
echo -e "   Password: admin123"
echo ""
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop all servers${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to stop
wait
