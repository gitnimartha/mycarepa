import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// In-memory store for verification codes (email -> { code, expiry })
const verificationCodes = new Map();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (data.expiry < now) {
      verificationCodes.delete(email);
    }
  }
}, 5 * 60 * 1000);

// Middleware - CORS configuration for Readdy frontend
const allowedOrigins = [
  'https://mycarepersonalassistant.com',
  'https://www.mycarepersonalassistant.com',
  'https://mycarepa-production.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow all origins for now but could restrict later
    return callback(null, true);
  },
  credentials: true,
}));
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
    includedHours: 4,
    monthlyFee: 99,
  },
  plus: {
    base: process.env.MYCARE_PRICE_PLUS_BASE,
    hourly: process.env.MYCARE_PRICE_PLUS_HOURLY,
    name: 'My Care Plus',
    includedHours: 10,
    monthlyFee: 249,
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

    // Get current billing period from subscription items
    const periodStart = subscription.items?.data?.[0]?.current_period_start
      || subscription.billing_cycle_anchor
      || subscription.start_date;
    const periodEnd = subscription.items?.data?.[0]?.current_period_end;

    // Get meter usage summary
    const meterSummary = await stripe.billing.meters.listEventSummaries(
      process.env.MYCARE_METER_ID,
      {
        customer: customerId,
        start_time: periodStart,
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
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
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

// Send verification code to email
app.post('/api/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if customer exists with active subscription
    const customers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(404).json({
        error: 'No subscription found',
        message: 'No active subscription found for this email. Please subscribe first.'
      });
    }

    const customer = customers.data[0];

    // Check for active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({
        error: 'No active subscription',
        message: 'Your subscription is not active. Please renew to schedule meetings.'
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes from now (Unix timestamp)

    // Store code in Stripe customer metadata (persistent across Railway sleep/wake)
    await stripe.customers.update(customer.id, {
      metadata: {
        verification_code: code,
        verification_expiry: expiry.toString(),
        verification_attempts: '0'
      }
    });

    // Send email via Resend
    if (resend) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'MyCarePA <onboarding@resend.dev>',
        to: normalizedEmail,
        subject: 'Your MyCarePA Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #A8B89F; margin: 0;">MyCarePA</h1>
            </div>
            <div style="background: #FFF8F0; border-radius: 12px; padding: 30px; text-align: center;">
              <p style="color: #6B6B6B; margin-bottom: 20px;">Your verification code is:</p>
              <div style="font-size: 36px; font-weight: bold; color: #2C2C2C; letter-spacing: 8px; margin-bottom: 20px;">${code}</div>
              <p style="color: #6B6B6B; font-size: 14px;">This code expires in 10 minutes.</p>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `,
      });
    } else {
      console.log(`[DEV] Verification code for ${normalizedEmail}: ${code}`);
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email.',
      // TEMPORARY: Include code for testing until email is configured
      _tempCode: code
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
});

// Verify customer by email and check usage
app.post('/api/verify-customer', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Search for customer by email
    const customers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(404).json({
        error: 'No subscription found',
        message: 'No active subscription found for this email.'
      });
    }

    const customer = customers.data[0];

    // Get verification data from customer metadata
    const storedCode = customer.metadata.verification_code;
    const storedExpiry = parseInt(customer.metadata.verification_expiry || '0');
    const attempts = parseInt(customer.metadata.verification_attempts || '0');

    if (!storedCode) {
      return res.status(400).json({
        error: 'Invalid or expired code',
        message: 'Please request a new verification code.'
      });
    }

    // Check if code has expired
    const now = Math.floor(Date.now() / 1000);
    if (now > storedExpiry) {
      // Clear expired code
      await stripe.customers.update(customer.id, {
        metadata: { verification_code: '', verification_expiry: '', verification_attempts: '' }
      });
      return res.status(400).json({
        error: 'Code expired',
        message: 'Your verification code has expired. Please request a new one.'
      });
    }

    // Check attempts (max 5)
    if (attempts >= 5) {
      await stripe.customers.update(customer.id, {
        metadata: { verification_code: '', verification_expiry: '', verification_attempts: '' }
      });
      return res.status(400).json({
        error: 'Too many attempts',
        message: 'Too many incorrect attempts. Please request a new code.'
      });
    }

    // Verify the code
    if (storedCode !== code) {
      await stripe.customers.update(customer.id, {
        metadata: { verification_attempts: (attempts + 1).toString() }
      });
      return res.status(400).json({
        error: 'Invalid code',
        message: 'Incorrect verification code. Please try again.'
      });
    }

    // Code is valid - clear it so it can't be reused
    await stripe.customers.update(customer.id, {
      metadata: { verification_code: '', verification_expiry: '', verification_attempts: '' }
    });

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({
        error: 'No active subscription',
        canSchedule: false,
        message: 'Your subscription is not active. Please renew to schedule meetings.'
      });
    }

    const subscription = subscriptions.data[0];
    const plan = subscription.metadata.plan || 'starter';
    const includedHours = parseInt(subscription.metadata.included_hours || '5');

    // Get current billing period - check subscription items first, then fallback
    const periodStart = subscription.items?.data?.[0]?.current_period_start
      || subscription.billing_cycle_anchor
      || subscription.start_date;
    const periodEnd = subscription.items?.data?.[0]?.current_period_end;

    // Get usage for current billing period
    let usedHours = 0;
    try {
      if (process.env.MYCARE_METER_ID && periodStart) {
        const meterSummary = await stripe.billing.meters.listEventSummaries(
          process.env.MYCARE_METER_ID,
          {
            customer: customer.id,
            start_time: periodStart,
            end_time: Math.floor(Date.now() / 1000),
          }
        );
        usedHours = meterSummary.data.reduce((sum, event) => sum + parseFloat(event.aggregated_value || 0), 0);
      }
    } catch (meterError) {
      console.log('Meter lookup skipped:', meterError.message);
    }

    const remainingHours = Math.max(0, includedHours - usedHours);
    const canSchedule = remainingHours > 0;

    res.json({
      canSchedule,
      customerId: customer.id,
      customerName: customer.name || '',
      email: customer.email,
      plan,
      includedHours,
      usedHours,
      remainingHours,
      currentPeriodEnd: periodEnd,
      message: canSchedule
        ? `You have ${remainingHours} hours remaining this period.`
        : 'You have used all your hours this period. Please upgrade your plan to continue.'
    });
  } catch (error) {
    console.error('Error verifying customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ASSISTANT DASHBOARD ENDPOINTS
// ============================================

// Assistant login
app.post('/api/assistant/login', (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.ASSISTANT_PASSWORD || 'mycarepa2024';

  if (password === correctPassword) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Assistant: Lookup customer by email
app.post('/api/assistant/lookup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify password
    const correctPassword = process.env.ASSISTANT_PASSWORD || 'mycarepa2024';
    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Search for customer
    const customers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers.data[0];

    // Get subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.json({
        customerId: customer.id,
        customerName: customer.name || '',
        email: customer.email,
        hasSubscription: false,
        message: 'No active subscription'
      });
    }

    const subscription = subscriptions.data[0];
    const plan = subscription.metadata.plan || 'starter';
    const includedHours = parseInt(subscription.metadata.included_hours || '5');

    // Get billing period
    const periodStart = subscription.items?.data?.[0]?.current_period_start
      || subscription.billing_cycle_anchor
      || subscription.start_date;
    const periodEnd = subscription.items?.data?.[0]?.current_period_end;

    // Get usage
    let usedHours = 0;
    try {
      if (process.env.MYCARE_METER_ID && periodStart) {
        const meterSummary = await stripe.billing.meters.listEventSummaries(
          process.env.MYCARE_METER_ID,
          {
            customer: customer.id,
            start_time: periodStart,
            end_time: Math.floor(Date.now() / 1000),
          }
        );
        usedHours = meterSummary.data.reduce((sum, event) => sum + parseFloat(event.aggregated_value || 0), 0);
      }
    } catch (meterError) {
      console.log('Meter lookup error:', meterError.message);
    }

    const remainingHours = Math.max(0, includedHours - usedHours);

    res.json({
      customerId: customer.id,
      customerName: customer.name || '',
      email: customer.email,
      hasSubscription: true,
      plan,
      includedHours,
      usedHours: Math.round(usedHours * 100) / 100,
      remainingHours: Math.round(remainingHours * 100) / 100,
      periodStart,
      periodEnd,
      periodStartDate: new Date(periodStart * 1000).toLocaleDateString(),
      periodEndDate: new Date(periodEnd * 1000).toLocaleDateString(),
    });
  } catch (error) {
    console.error('Error looking up customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assistant: Report usage
app.post('/api/assistant/report-usage', async (req, res) => {
  try {
    const { customerId, hours, password, inputtedBy } = req.body;

    // Verify password
    const correctPassword = process.env.ASSISTANT_PASSWORD || 'mycarepa2024';
    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!customerId || !hours) {
      return res.status(400).json({ error: 'Customer ID and hours are required' });
    }

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      return res.status(400).json({ error: 'Hours must be a positive number' });
    }

    // Report usage to Stripe
    const meterEvent = await stripe.billing.meterEvents.create({
      event_name: process.env.MYCARE_METER_EVENT_NAME || 'assistant_hours_used',
      payload: {
        stripe_customer_id: customerId,
        hours: hoursNum.toString(),
      },
      timestamp: Math.floor(Date.now() / 1000),
    });

    // Store usage log in customer metadata
    const customer = await stripe.customers.retrieve(customerId);
    const existingLog = customer.metadata.usage_log ? JSON.parse(customer.metadata.usage_log) : [];

    // Add new entry (keep last 50 entries to avoid metadata size limits)
    const newEntry = {
      date: new Date().toISOString(),
      hours: hoursNum,
      inputtedBy: inputtedBy || 'Unknown',
      eventId: meterEvent.identifier,
    };
    existingLog.push(newEntry);
    const trimmedLog = existingLog.slice(-50);

    // Update customer metadata
    await stripe.customers.update(customerId, {
      metadata: {
        ...customer.metadata,
        usage_log: JSON.stringify(trimmedLog),
      },
    });

    res.json({
      success: true,
      message: `Successfully logged ${hoursNum} hours`,
      eventId: meterEvent.identifier,
      reportedHours: hoursNum,
      inputtedBy: inputtedBy || 'Unknown',
    });
  } catch (error) {
    console.error('Error reporting usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes in production (SPA catch-all)
if (process.env.NODE_ENV === 'production') {

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`My Care API server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\nAvailable endpoints:');
  console.log('  POST /api/create-checkout-session - Create subscription checkout');
  console.log('  POST /api/verify-customer - Verify customer email and check usage');
  console.log('  POST /api/report-usage - Report hours used');
  console.log('  GET  /api/usage/:customerId - Get customer usage');
  console.log('  GET  /api/prices - Get available plans');
  console.log('  GET  /api/session/:sessionId - Get session details');
  console.log('  POST /api/webhook - Stripe webhook handler');
  console.log('  GET  /api/health - Health check');
});
