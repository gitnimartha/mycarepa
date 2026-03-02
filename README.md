# My Care Personal Assistant - Pricing App

A React + TypeScript pricing and subscription app with Stripe integration for the My Care Personal Assistant service.

## Features

- React 19 + TypeScript + Vite
- Tailwind CSS 4.x styling
- Stripe Checkout & usage-based billing
- Email verification for members
- Assistant dashboard for logging hours
- Express.js backend API

## Prerequisites

- Node.js 22+
- npm

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your Stripe keys.

### 3. Run the application

Start both frontend and backend with a single command:

```bash
npm run dev:all
```

Or run separately:

```bash
npm run server   # Backend API (port 3001)
npm run dev      # Frontend (port 5173)
```

### 4. Open in browser

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001

## App Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage with pricing plans |
| `/success` | Post-payment success page with Calendly booking |
| `/schedule` | Member scheduling (email verification required) |
| `/assistant` | Staff dashboard to log hours used |
| `/privacy-policy` | Privacy policy |
| `/terms-of-service` | Terms of service |
| `/assistant-guidelines` | Assistant guidelines |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start frontend + backend together |
| `npm run dev` | Start Vite frontend only |
| `npm run server` | Start Express backend only |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-checkout-session` | POST | Create Stripe checkout session |
| `/api/send-verification-code` | POST | Send email verification code |
| `/api/verify-customer` | POST | Verify code & check usage |
| `/api/report-usage` | POST | Report hours used |
| `/api/usage/:customerId` | GET | Get customer usage stats |
| `/api/prices` | GET | Get available plans |
| `/api/session/:sessionId` | GET | Get checkout session details |
| `/api/webhook` | POST | Stripe webhook handler |
| `/api/assistant/login` | POST | Assistant dashboard login |
| `/api/assistant/lookup` | POST | Lookup customer by email |
| `/api/assistant/report-usage` | POST | Log hours for customer |
| `/api/admin/create-trial-user` | POST | Create legacy trial user |
| `/api/health` | GET | Health check |

## Pricing Plans

| Plan | Monthly | Included Hours | Overage |
|------|---------|----------------|---------|
| Trial | $0 | 1 hr | N/A |
| Starter | $99 | 4 hrs | $35/hr |
| Plus | $249 | 10 hrs | $32/hr |
| Pro | $499 | 20 hrs | $28/hr |

## Deployment

### Railway (Production)

The app is deployed on Railway at: https://mycarepa-production.up.railway.app

To deploy:

```bash
railway up
```

### Production Setup

For setting up a new Stripe account with products/prices:

```bash
cd scripts
setup-production.bat
```

This will:
1. Create Stripe products, prices, and billing meter
2. Update local `.env` with new IDs
3. Update Railway environment variables

## Syncing UI from Readdy

If UI changes are made in Readdy's web editor:

```bash
cd scripts
sync-from-readdy.bat "E:\path\to\readdy\download"
```

This script:
- Copies UI files from Readdy download
- Automatically fixes Readdy-specific code
- Skips core files that shouldn't be overwritten

## Project Structure

```
pricing-app/
├── src/
│   ├── pages/
│   │   ├── home/           # Homepage components
│   │   ├── schedule/       # Member scheduling
│   │   ├── success/        # Post-payment page
│   │   └── assistant-dashboard/  # Staff dashboard
│   ├── router/             # React Router config
│   ├── config/api.ts       # API configuration
│   ├── App.tsx             # Main React app
│   └── index.css           # Tailwind styles
├── scripts/
│   ├── setup-production.bat    # Production setup
│   ├── setup-stripe-products.js
│   └── sync-from-readdy.*      # Readdy sync scripts
├── server.js               # Express backend API
├── .env                    # Environment variables
├── Dockerfile              # Docker build
└── package.json
```

## Docker (Local)

```bash
# Build
docker build -t mycare-pricing-app .

# Run
docker run -p 3001:3001 --env-file .env mycare-pricing-app
```

## License

Proprietary - LegalMatch
