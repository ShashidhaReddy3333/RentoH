@echo off
echo ========================================
echo Testing RentoH Locally
echo ========================================
echo.

echo Step 1: Checking if .env.local exists...
if exist .env.local (
    echo [OK] .env.local file found
) else (
    echo [ERROR] .env.local NOT found!
    echo Please copy env.example to .env.local and add your Supabase credentials
    pause
    exit
)

echo.
echo Step 2: Checking Node modules...
if exist node_modules (
    echo [OK] node_modules found
) else (
    echo [INFO] Installing dependencies...
    call pnpm install
)

echo.
echo Step 3: Building Next.js app...
call pnpm build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check errors above.
    pause
    exit
)

echo.
echo Step 4: Starting dev server...
echo.
echo ========================================
echo Server will start at http://localhost:3000
echo.
echo Open your browser and:
echo 1. Go to http://localhost:3000
echo 2. Sign in with your account
echo 3. Go to any property page
echo 4. Try "Request a tour"
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call pnpm dev
