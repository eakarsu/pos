#!/bin/sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Export environment variables explicitly
export NODE_ENV=production
export PORT=3000
export DATABASE_URL="file:./data/pos.db"
export JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
export JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
export CORS_ORIGIN="http://localhost:5173"
export API_VERSION=1

echo -e "${BLUE}🚀 POS System Docker Startup${NC}"
echo "=================================="

# Function to check if a port is in use
port_in_use() {
    netstat -ln | grep ":$1 " >/dev/null 2>&1
}

# Check if database exists and is accessible
echo -e "\n${BLUE}🗄️  Checking database...${NC}"
if npx prisma db push --accept-data-loss >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database ready${NC}"
else
    echo -e "${YELLOW}⚠️  Database not ready, initializing...${NC}"
    npx prisma db push --force-reset
    npx tsx prisma/seed.ts
    echo -e "${GREEN}✅ Database initialized${NC}"
fi

# Install frontend dependencies if not already installed
echo -e "\n${BLUE}📦 Installing frontend dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi
cd ..

# Start backend server
echo -e "\n${BLUE}🚀 Starting backend server...${NC}"
NODE_ENV=production \
PORT=3000 \
DATABASE_URL="file:./data/pos.db" \
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production" \
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production" \
CORS_ORIGIN="http://localhost:5173" \
API_VERSION=1 \
node dist/server.js &
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

# Wait for processes to finish
wait
