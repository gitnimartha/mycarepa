import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// My Care Personal Assistant - Price Configuration
const MYCARE_PRICES = {
  trial: {
    base: process.env.MYCARE_PRICE_TRIAL,
    name: 'Free Trial',
    includedHours: 3,
  },
  starter: {
    base: process.env.MYCARE_PRICE_STARTER_BASE,
    hourly: process.env.MYCARE_PRICE_STARTER_HOURLY,
    name: 'My Care Starter',
    includedHours: 5,
    monthlyFee: 149,
  },
  plus: {
    base: process.env.MYCARE_PRICE_PLUS_BASE,
    hourly: process.env.MYCARE_PRICE_PLUS_HOURLY,
    name: 'My Care Plus',
    includedHours: 10,
    monthlyFee: 279,
  },
  pro: {
    base: process.env.MYCARE_PRICE_PRO_BASE,
    hourly: process.env.MYCARE_PRICE_PRO_HOURLY,
    name: 'My Care Pro',
    includedHours: 20,
    monthlyFee: 499,
  },
};

// Create checkout session for My Care subscriptions
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { plan, customerEmail } = req.body;
    const planKey = plan.toLowerCase();
    const planConfig = MYCARE_PRICES[planKey];

    if (!planConfig) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Build line items - base subscription + metered overage (if not trial)
    const lineItems = [
      {
        price: planConfig.base,
        quantity: 1,
      },
    ];

    // Add metered overage price for paid plans
    if (planConfig.hourly) {
      lineItems.push({
        price: planConfig.hourly,
      });
    }

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/`,
      metadata: {
        plan: planKey,
        included_hours: planConfig.includedHours.toString(),
      },
      subscription_data: {
        metadata: {
          plan: planKey,
          included_hours: planConfig.includedHours.toString(),
        },
      },
    };

    // Add customer email if provided
    if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    // For free trial, allow trial period
    if (planKey === 'trial') {
      sessionConfig.subscription_data.trial_period_days = 30;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Report usage hours for a customer
app.post('/api/report-usage', async (req, res) => {
  try {
    const { customerId, hours } = req.body;

    if (!customerId || !hours) {
      return res.status(400).json({ error: 'customerId and hours are required' });
    }

    const meterEvent = await stripe.billing.meterEvents.create({
      event_name: process.env.MYCARE_METER_EVENT_NAME || 'assistant_hours_used',
      payload: {
        stripe_customer_id: customerId,
        value: hours.toString(),
      },
      timestamp: Math.floor(Date.now() / 1000),
    });

    res.json({ success: true, meterEvent });
  } catch (error) {
    console.error('Error reporting usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer's current usage
app.get('/api/usage/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscription = subscriptions.data[0];
    const plan = subscription.metadata.plan;
    const includedHours = parseInt(subscription.metadata.included_hours || '0');

    // Get meter usage summary
    const meterSummary = await stripe.billing.meters.listEventSummaries(
      process.env.MYCARE_METER_ID,
      {
        customer: customerId,
        start_time: Math.floor(new Date(subscription.current_period_start * 1000).getTime() / 1000),
        end_time: Math.floor(Date.now() / 1000),
      }
    );

    const totalUsedHours = meterSummary.data.reduce((sum, event) => sum + parseFloat(event.aggregated_value), 0);
    const overageHours = Math.max(0, totalUsedHours - includedHours);

    res.json({
      plan,
      includedHours,
      usedHours: totalUsedHours,
      remainingHours: Math.max(0, includedHours - totalUsedHours),
      overageHours,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all available prices
app.get('/api/prices', async (req, res) => {
  try {
    res.json({
      plans: Object.entries(MYCARE_PRICES).map(([key, config]) => ({
        id: key,
        name: config.name,
        includedHours: config.includedHours,
        monthlyFee: config.monthlyFee || 0,
        basePriceId: config.base,
        hourlyPriceId: config.hourly || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session details
app.get('/api/session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['subscription', 'customer'],
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook for Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout completed:', session.id);
      // Handle successful checkout (e.g., provision access)
      break;

    case 'invoice.paid':
      const invoice = event.data.object;
      console.log('Invoice paid:', invoice.id);
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('Subscription updated:', subscription.id);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      console.log('Subscription cancelled:', deletedSub.id);
      // Handle cancellation (e.g., revoke access)
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes in production (SPA catch-all)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`My Care API server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\nAvailable endpoints:');
  console.log('  POST /api/create-checkout-session - Create subscription checkout');
  console.log('  POST /api/report-usage - Report hours used');
  console.log('  GET  /api/usage/:customerId - Get customer usage');
  console.log('  GET  /api/prices - Get available plans');
  console.log('  GET  /api/session/:sessionId - Get session details');
  console.log('  POST /api/webhook - Stripe webhook handler');
  console.log('  GET  /api/health - Health check');
});
