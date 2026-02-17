# My Care Personal Assistant - Pricing App

A React + TypeScript pricing page with Stripe integration for the My Care Personal Assistant service.

## Features

- React 19 + TypeScript + Vite
- Tailwind CSS 4.x styling
- Stripe Checkout integration
- Usage-based billing with Stripe Billing Meters
- Express.js backend API

## Prerequisites

- Node.js 22+
- npm or yarn

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

Update `.env` with your Stripe keys (get from team or Stripe dashboard).

### 3. Run the application

Start both frontend and backend:

```bash
# Terminal 1: Start the backend API server
node server.js

# Terminal 2: Start the frontend dev server
npm run dev
```

### 4. Open in browser

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `node server.js` | Start Express API server |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-checkout-session` | POST | Create Stripe checkout session |
| `/api/report-usage` | POST | Report usage hours to Stripe |
| `/api/usage/:customerId` | GET | Get customer usage stats |
| `/api/prices` | GET | Get available plans |
| `/api/session/:sessionId` | GET | Get checkout session details |
| `/api/webhook` | POST | Stripe webhook handler |
| `/api/health` | GET | Health check |

## Project Structure

```
pricing-app/
├── src/
│   ├── App.tsx          # Main React app with all components
│   └── index.css        # Tailwind CSS styles
├── server.js            # Express backend API
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment file
├── Dockerfile           # Docker build configuration
└── package.json
```

## Stripe Setup

To create the required Stripe products and prices:

```bash
node setup-mycare-products.js
```

This creates:
- **Free Trial**: $0/month, 3 hours included
- **Starter**: $149/month, 5 hours included, $35/hr overage
- **Plus**: $279/month, 10 hours included, $32/hr overage
- **Pro**: $499/month, 20 hours included, $28/hr overage

## Docker (Local)

```bash
# Build
docker build -t mycare-pricing-app .

# Run
docker run -p 3001:3001 --env-file .env mycare-pricing-app
```

Or use Docker Compose:

```bash
docker-compose up --build
```

## License

Proprietary - LegalMatch
