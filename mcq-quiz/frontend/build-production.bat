@echo off
REM ================================================================
REM 🚀 Production Build Script with Optimizations (Windows)
REM ================================================================

echo ======================================
echo 🚀 Starting Production Build
echo ======================================
echo.

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ Error: package.json not found
    echo Please run this script from the frontend directory
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo 🧹 Cleaning previous build...
if exist build rmdir /s /q build
echo ✅ Cleaned
echo.

echo ⚙️  Setting environment for production...
set GENERATE_SOURCEMAP=false
set INLINE_RUNTIME_CHUNK=false
echo ✅ Environment configured
echo.

echo 🔨 Building optimized production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)
echo ✅ Build completed successfully
echo.

echo 📊 Build completed!
if exist build (
    echo Build folder created successfully
)
echo.

echo ======================================
echo ✅ Production build complete!
echo ======================================
echo.
echo Next steps:
echo 1. Deploy to Vercel: vercel --prod
echo 2. Or upload the 'build' folder to your hosting
echo.

pause
