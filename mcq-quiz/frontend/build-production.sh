#!/bin/bash

# 🚀 Production Build Script with Optimizations

echo "======================================"
echo "🚀 Starting Production Build"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the frontend directory"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf build
echo -e "${GREEN}✅ Cleaned${NC}"
echo ""

echo -e "${YELLOW}⚙️  Setting environment for production...${NC}"
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

echo -e "${YELLOW}🔨 Building optimized production bundle...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build completed successfully${NC}"
echo ""

echo -e "${YELLOW}📊 Analyzing build size...${NC}"
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    echo -e "${GREEN}Total build size: $BUILD_SIZE${NC}"
    
    if command -v tree &> /dev/null; then
        echo ""
        echo "Build structure:"
        tree -L 2 build
    fi
fi
echo ""

echo "======================================"
echo -e "${GREEN}✅ Production build complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Or upload the 'build' folder to your hosting"
echo ""
