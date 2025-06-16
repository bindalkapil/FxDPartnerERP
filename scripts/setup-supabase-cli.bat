@echo off
setlocal enabledelayedexpansion

echo 🚀 Supabase CLI Setup Script (Windows)
echo ========================================

REM Check if Supabase CLI is installed
echo [INFO] Checking if Supabase CLI is installed...
supabase --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Supabase CLI is already installed
    supabase --version
) else (
    echo [WARNING] Supabase CLI not found. Please install it first:
    echo.
    echo Windows (Scoop):
    echo   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
    echo   scoop install supabase
    echo.
    echo Cross-platform (npm):
    echo   npm install -g supabase
    echo.
    pause
    exit /b 1
)

REM Check if already logged in
echo [INFO] Checking authentication status...
supabase projects list >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Already authenticated with Supabase
) else (
    echo [INFO] Not authenticated. Please login to Supabase...
    echo.
    echo You'll need your access token from:
    echo https://supabase.com/dashboard/account/tokens
    echo.
    pause
    
    supabase login
    
    if %errorlevel% equ 0 (
        echo [SUCCESS] Successfully authenticated with Supabase
    ) else (
        echo [ERROR] Authentication failed. Please check your access token.
        pause
        exit /b 1
    )
)

REM Check if project is already linked
echo [INFO] Checking if project is linked...
if exist ".supabase\config.toml" (
    echo [SUCCESS] Project appears to be already linked
    
    REM Verify the link works
    supabase status >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Project link is working correctly
    ) else (
        echo [WARNING] Project link exists but may not be working. Re-linking...
        rmdir /s /q .supabase
    )
)

REM Link project if not already linked
if not exist ".supabase\config.toml" (
    echo [INFO] Linking to your Supabase project...
    echo.
    echo You'll need your project reference ID from your Supabase dashboard URL:
    echo https://supabase.com/dashboard/project/[PROJECT_ID]
    echo.
    echo Example: rsdblnraeopboalemjjo
    echo.
    
    set /p PROJECT_ID="Enter your project reference ID: "
    
    if "!PROJECT_ID!"=="" (
        echo [ERROR] Project ID cannot be empty
        pause
        exit /b 1
    )
    
    echo [INFO] Linking to project: !PROJECT_ID!
    supabase link --project-ref "!PROJECT_ID!"
    
    if %errorlevel% equ 0 (
        echo [SUCCESS] Successfully linked to project: !PROJECT_ID!
    ) else (
        echo [ERROR] Failed to link project. Please check your project ID.
        pause
        exit /b 1
    )
)

REM Verify everything is working
echo [INFO] Verifying setup...

REM Check if we can list projects
supabase projects list >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] ✅ Authentication working
) else (
    echo [ERROR] ❌ Authentication not working
    pause
    exit /b 1
)

REM Check if we can list migrations
supabase migration list >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] ✅ Project link working
    echo [INFO] Current migrations:
    supabase migration list
) else (
    echo [ERROR] ❌ Project link not working
    pause
    exit /b 1
)

echo.
echo [SUCCESS] 🎉 Supabase CLI setup completed successfully!
echo.
echo Next steps:
echo 1. Run: scripts\deploy-migration.bat
echo 2. Or manually: supabase db push
echo.
echo Available commands:
echo   supabase migration list    - List all migrations
echo   supabase db push          - Deploy migrations
echo   supabase db push --dry-run - Test migrations without applying
echo   supabase status           - Check project status
echo.
pause
