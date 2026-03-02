@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo   MyCarePA Production Setup
echo ==========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    exit /b 1
)

:: Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Railway CLI is not installed.
    echo Install it with: npm install -g @railway/cli
    exit /b 1
)

echo Step 1: Enter your production credentials
echo ------------------------------------------
echo.

:: Stripe Keys
set /p STRIPE_SECRET_KEY="Enter Stripe SECRET KEY (sk_live_...): "
set /p STRIPE_PUBLISHABLE_KEY="Enter Stripe PUBLISHABLE KEY (pk_live_...): "

:: Calendly URL
set /p CALENDLY_URL="Enter Calendly URL (https://calendly.com/...): "

:: Resend
set /p RESEND_API_KEY="Enter Resend API KEY (re_...): "
set /p RESEND_FROM_EMAIL="Enter Resend FROM email (e.g., noreply@yourdomain.com): "

:: Assistant Password
set /p ASSISTANT_PASSWORD="Enter Assistant Dashboard password: "

echo.
echo Step 2: Creating Stripe Products and Prices
echo --------------------------------------------
echo.

:: Run Stripe setup script
node "%~dp0setup-stripe-products.js" "%STRIPE_SECRET_KEY%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create Stripe products.
    exit /b 1
)

:: Read the generated price IDs from temp file
for /f "tokens=1,2 delims==" %%a in (%~dp0stripe-ids.tmp) do (
    set "%%a=%%b"
)

echo.
echo Step 3: Updating local .env file
echo ---------------------------------
echo.

:: Backup existing .env
copy "%~dp0..\.env" "%~dp0..\.env.backup" >nul 2>nul
echo Backed up .env to .env.backup

:: Create new .env content
(
echo # Stripe Keys - PRODUCTION
echo VITE_STRIPE_PUBLISHABLE_KEY=%STRIPE_PUBLISHABLE_KEY%
echo STRIPE_SECRET_KEY=%STRIPE_SECRET_KEY%
echo.
echo # My Care Personal Assistant - Billing Meter
echo MYCARE_METER_ID=%MYCARE_METER_ID%
echo MYCARE_METER_EVENT_NAME=assistant_hours_used
echo.
echo # My Care Personal Assistant - Products
echo MYCARE_PRODUCT_TRIAL=%MYCARE_PRODUCT_TRIAL%
echo MYCARE_PRODUCT_STARTER=%MYCARE_PRODUCT_STARTER%
echo MYCARE_PRODUCT_PLUS=%MYCARE_PRODUCT_PLUS%
echo MYCARE_PRODUCT_PRO=%MYCARE_PRODUCT_PRO%
echo.
echo # My Care Personal Assistant - Prices
echo MYCARE_PRICE_TRIAL=%MYCARE_PRICE_TRIAL%
echo MYCARE_PRICE_STARTER_BASE=%MYCARE_PRICE_STARTER_BASE%
echo MYCARE_PRICE_STARTER_HOURLY=%MYCARE_PRICE_STARTER_HOURLY%
echo MYCARE_PRICE_PLUS_BASE=%MYCARE_PRICE_PLUS_BASE%
echo MYCARE_PRICE_PLUS_HOURLY=%MYCARE_PRICE_PLUS_HOURLY%
echo MYCARE_PRICE_PRO_BASE=%MYCARE_PRICE_PRO_BASE%
echo MYCARE_PRICE_PRO_HOURLY=%MYCARE_PRICE_PRO_HOURLY%
echo.
echo # Calendly
echo VITE_CALENDLY_URL=%CALENDLY_URL%
echo.
echo # Resend ^(Email^)
echo RESEND_API_KEY=%RESEND_API_KEY%
echo RESEND_FROM_EMAIL=%RESEND_FROM_EMAIL%
echo.
echo # Server
echo PORT=3001
echo.
echo # Assistant Dashboard
echo ASSISTANT_PASSWORD=%ASSISTANT_PASSWORD%
) > "%~dp0..\.env"

echo Local .env updated successfully!

echo.
echo Step 4: Updating Railway environment variables
echo -----------------------------------------------
echo.

:: Update Railway env vars
railway variables set STRIPE_SECRET_KEY="%STRIPE_SECRET_KEY%"
railway variables set VITE_STRIPE_PUBLISHABLE_KEY="%STRIPE_PUBLISHABLE_KEY%"
railway variables set MYCARE_METER_ID="%MYCARE_METER_ID%"
railway variables set MYCARE_METER_EVENT_NAME="assistant_hours_used"
railway variables set MYCARE_PRODUCT_TRIAL="%MYCARE_PRODUCT_TRIAL%"
railway variables set MYCARE_PRODUCT_STARTER="%MYCARE_PRODUCT_STARTER%"
railway variables set MYCARE_PRODUCT_PLUS="%MYCARE_PRODUCT_PLUS%"
railway variables set MYCARE_PRODUCT_PRO="%MYCARE_PRODUCT_PRO%"
railway variables set MYCARE_PRICE_TRIAL="%MYCARE_PRICE_TRIAL%"
railway variables set MYCARE_PRICE_STARTER_BASE="%MYCARE_PRICE_STARTER_BASE%"
railway variables set MYCARE_PRICE_STARTER_HOURLY="%MYCARE_PRICE_STARTER_HOURLY%"
railway variables set MYCARE_PRICE_PLUS_BASE="%MYCARE_PRICE_PLUS_BASE%"
railway variables set MYCARE_PRICE_PLUS_HOURLY="%MYCARE_PRICE_PLUS_HOURLY%"
railway variables set MYCARE_PRICE_PRO_BASE="%MYCARE_PRICE_PRO_BASE%"
railway variables set MYCARE_PRICE_PRO_HOURLY="%MYCARE_PRICE_PRO_HOURLY%"
railway variables set VITE_CALENDLY_URL="%CALENDLY_URL%"
railway variables set RESEND_API_KEY="%RESEND_API_KEY%"
railway variables set RESEND_FROM_EMAIL="%RESEND_FROM_EMAIL%"
railway variables set ASSISTANT_PASSWORD="%ASSISTANT_PASSWORD%"

echo Railway environment variables updated!

:: Cleanup temp file
del "%~dp0stripe-ids.tmp" >nul 2>nul

echo.
echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Run 'railway up' to deploy with new settings
echo 2. Test the subscription flow
echo 3. Verify email sending works
echo.

pause
