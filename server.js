import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Build timestamp: 2026-03-11T02:56:00Z - force rebuild v2

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

// Helper: Find customer by email
async function findCustomerByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await stripe.customers.list({
    email: normalizedEmail,
    limit: 1,
  });

  return result.data.length > 0 ? result.data[0] : null;
}

// Helper: Find ALL customers by email
async function findAllCustomersByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();

  // Simple list - Stripe returns all customers with exact email match
  const result = await stripe.customers.list({
    email: normalizedEmail,
    limit: 100,
  });

  console.log(`[findAllCustomersByEmail] Found ${result.data.length} customers for ${normalizedEmail}`);
  return result.data;
}

// Helper: Get all active subscriptions for an email
async function getAllSubscriptionsForEmail(email) {
  const customers = await findAllCustomersByEmail(email);
  const allSubscriptions = [];

  for (const customer of customers) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10,
    });

    for (const subscription of subscriptions.data) {
      const plan = subscription.metadata.plan || 'starter';
      const includedHours = parseInt(subscription.metadata.included_hours || '5');

      const periodStart = subscription.items?.data?.[0]?.current_period_start
        || subscription.billing_cycle_anchor
        || subscription.start_date;
      const periodEnd = subscription.items?.data?.[0]?.current_period_end;

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

      allSubscriptions.push({
        subscriptionId: subscription.id,
        customerId: customer.id,
        customerName: customer.name || '',
        email: customer.email,
        plan,
        includedHours,
        usedHours: Math.round(usedHours * 100) / 100,
        remainingHours: Math.round(remainingHours * 100) / 100,
        canSchedule: remainingHours > 0 || plan.toLowerCase() !== 'trial',
        periodStart,
        periodEnd,
        periodStartDate: periodStart ? new Date(periodStart * 1000).toLocaleDateString() : null,
        periodEndDate: periodEnd ? new Date(periodEnd * 1000).toLocaleDateString() : null,
        created: subscription.created,
      });
    }
  }

  // Sort by creation date (oldest first)
  allSubscriptions.sort((a, b) => a.created - b.created);

  return allSubscriptions;
}

// Middleware - CORS configuration for Readdy frontend
const allowedOrigins = [
  'https://mycarepersonalassistant.com',
  'https://www.mycarepersonalassistant.com',
  'https://mycarepa-production.up.railway.app',
  'https://mycarepa-production-2432.up.railway.app',
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

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
      payment_method_types: ['card'], // Only card, no Link
      line_items: lineItems,
      mode: 'subscription',
      currency: 'usd',
      locale: 'en',
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

    // Check if customer already exists - reuse to avoid duplicates
    if (customerEmail) {
      const existingCustomer = await findCustomerByEmail(customerEmail);

      if (existingCustomer) {
        // Check if they have an active subscription
        const activeSubscriptions = await stripe.subscriptions.list({
          customer: existingCustomer.id,
          status: 'active',
          limit: 1,
        });

        if (activeSubscriptions.data.length > 0) {
          const currentPlan = activeSubscriptions.data[0].metadata.plan || 'unknown';
          return res.status(400).json({
            error: 'Active subscription exists',
            message: `You already have an active ${currentPlan.toUpperCase()} subscription. Please contact support to change your plan.`,
            currentPlan,
          });
        }

        // Reuse existing customer
        sessionConfig.customer = existingCustomer.id;
      } else {
        // New customer
        sessionConfig.customer_email = customerEmail;
      }
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

    // Note: Test meter uses "hours" key, Live meter uses "value" key
    const meterEvent = await stripe.billing.meterEvents.create({
      event_name: process.env.MYCARE_METER_EVENT_NAME || 'assistant_hours_used',
      payload: {
        stripe_customer_id: customerId,
        value: hours.toString(),
        hours: hours.toString(),
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

// Check if email has active subscription (for duplicate subscription blocking)
app.post('/api/check-subscription', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const subscriptions = await getAllSubscriptionsForEmail(normalizedEmail);

    if (subscriptions.length > 0) {
      // Return info about the first active subscription
      const firstSub = subscriptions[0];
      return res.json({
        hasSubscription: true,
        plan: firstSub.plan,
        email: normalizedEmail,
        subscriptionCount: subscriptions.length,
      });
    }

    return res.json({
      hasSubscription: false,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send verification code to email
app.post('/api/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('[send-code] Request received for:', email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find customer by email (case-insensitive)
    console.log('[send-code] Looking up customer...');
    const customer = await findCustomerByEmail(email);
    console.log('[send-code] Customer found:', customer?.id);

    if (!customer) {
      return res.status(404).json({
        error: 'No subscription found',
        message: 'No active subscription found for this email. Please subscribe first.'
      });
    }

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
        to: customer.email,
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
      console.log(`[DEV] Verification code for ${customer.email}: ${code}`);
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email.',
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

    // Find customer by email (case-insensitive)
    const customer = await findCustomerByEmail(email);

    if (!customer) {
      return res.status(404).json({
        error: 'No subscription found',
        message: 'No active subscription found for this email.'
      });
    }

    // Check if this is a returning verified user (saved session)
    const isReturningUser = code === 'saved-session' && customer.metadata.email_verified === 'true';

    if (!isReturningUser) {
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

      // Code is valid - clear it and mark as verified
      await stripe.customers.update(customer.id, {
        metadata: {
          verification_code: '',
          verification_expiry: '',
          verification_attempts: '',
          email_verified: 'true'
        }
      });
    }

    // Get ALL active subscriptions for this email
    const allCustomers = await findAllCustomersByEmail(email);
    console.log(`[DEBUG] Found ${allCustomers.length} customers for email ${email}:`, allCustomers.map(c => ({ id: c.id, name: c.name, email: c.email })));

    const allSubscriptions = await getAllSubscriptionsForEmail(email);
    console.log(`[DEBUG] Found ${allSubscriptions.length} subscriptions:`, allSubscriptions.map(s => ({ id: s.subscriptionId, name: s.customerName, plan: s.plan })));

    if (allSubscriptions.length === 0) {
      return res.status(404).json({
        error: 'No active subscription',
        canSchedule: false,
        message: 'Your subscription is not active. Please renew to schedule meetings.'
      });
    }

    // First subscription for backwards compatibility
    const firstSub = allSubscriptions[0];

    res.json({
      // Array of all subscriptions
      subscriptions: allSubscriptions,
      // Backwards compatibility - first subscription at top level
      canSchedule: firstSub.canSchedule,
      customerId: firstSub.customerId,
      customerName: firstSub.customerName,
      email: firstSub.email,
      plan: firstSub.plan,
      includedHours: firstSub.includedHours,
      usedHours: firstSub.usedHours,
      remainingHours: firstSub.remainingHours,
      currentPeriodEnd: firstSub.periodEnd,
      message: firstSub.canSchedule
        ? `You have ${firstSub.remainingHours} hours remaining this period.`
        : 'You have used all your hours this period.'
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

// Assistant: Search customers by name or email (autocomplete)
app.post('/api/assistant/search', async (req, res) => {
  try {
    const { query, password } = req.body;

    // Verify password
    const correctPassword = process.env.ASSISTANT_PASSWORD || 'mycarepa2024';
    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!query || query.length < 2) {
      return res.json({ customers: [] });
    }

    const sanitizedQuery = query.toLowerCase().trim().replace(/'/g, "\\'");

    // Search customers by email or name using Stripe Search API
    const searchResult = await stripe.customers.search({
      query: `email~'${sanitizedQuery}' OR name~'${sanitizedQuery}'`,
      limit: 10,
    });

    // Get subscription status for each customer
    const customersWithSubs = await Promise.all(
      searchResult.data.map(async (customer) => {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 1,
        });
        const hasSubscription = subscriptions.data.length > 0;
        const plan = hasSubscription ? subscriptions.data[0].metadata.plan : null;

        return {
          customerId: customer.id,
          name: customer.name || '',
          email: customer.email,
          hasSubscription,
          plan: plan?.toUpperCase() || null,
        };
      })
    );

    // Only return customers with active subscriptions
    const activeCustomers = customersWithSubs.filter(c => c.hasSubscription);

    res.json({ customers: activeCustomers });
  } catch (error) {
    console.error('Customer search error:', error);
    res.status(500).json({ error: 'Failed to search customers' });
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

    // Get ALL subscriptions for this email
    const allSubscriptions = await getAllSubscriptionsForEmail(email);

    if (allSubscriptions.length === 0) {
      const customer = await findCustomerByEmail(email);
      if (customer) {
        return res.json({
          customerId: customer.id,
          customerName: customer.name || '',
          email: customer.email,
          hasSubscription: false,
          subscriptions: [],
          message: 'No active subscription'
        });
      }
      return res.status(404).json({ error: 'Customer not found' });
    }

    const firstSub = allSubscriptions[0];

    res.json({
      subscriptions: allSubscriptions.map(sub => ({ ...sub, hasSubscription: true })),
      // Backwards compatibility
      customerId: firstSub.customerId,
      customerName: firstSub.customerName,
      email: firstSub.email,
      hasSubscription: true,
      plan: firstSub.plan,
      includedHours: firstSub.includedHours,
      usedHours: firstSub.usedHours,
      remainingHours: firstSub.remainingHours,
      periodStart: firstSub.periodStart,
      periodEnd: firstSub.periodEnd,
      periodStartDate: firstSub.periodStartDate,
      periodEndDate: firstSub.periodEndDate,
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
    // Note: Test meter uses "hours" key, Live meter uses "value" key
    const meterEvent = await stripe.billing.meterEvents.create({
      event_name: process.env.MYCARE_METER_EVENT_NAME || 'assistant_hours_used',
      payload: {
        stripe_customer_id: customerId,
        value: hoursNum.toString(),
        hours: hoursNum.toString(),
      },
      timestamp: Math.floor(Date.now() / 1000),
    });

    // Store compact usage log in customer metadata (500 char limit)
    const customer = await stripe.customers.retrieve(customerId);
    const existingLog = customer.metadata.usage_log ? JSON.parse(customer.metadata.usage_log) : [];

    // Compact format: first 8 chars of event ID + who inputted
    const newEntry = {
      e: meterEvent.identifier.slice(0, 8),
      by: inputtedBy || '?',
    };
    existingLog.push(newEntry);
    const trimmedLog = existingLog.slice(-10); // ~30 chars each, 10 entries fits in 500

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

// Admin: Create trial user (legacy users without checkout)
app.post('/api/admin/create-trial-user', async (req, res) => {
  try {
    const { email, name, hours, password } = req.body;

    // Verify admin password
    const correctPassword = process.env.ADMIN_PASSWORD || process.env.ASSISTANT_PASSWORD || 'mycarepa2024';
    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trialHours = parseInt(hours) || 1;

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 1,
    });

    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];

      // Check if already has a subscription
      const existingSubs = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
      });

      if (existingSubs.data.length > 0) {
        return res.status(400).json({
          error: 'Customer already has a subscription',
          customerId: customer.id,
          email: customer.email
        });
      }
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: normalizedEmail,
        name: name || 'Trial User',
      });
    }

    // Create subscription with Trial price
    const trialPriceId = process.env.MYCARE_PRICE_TRIAL;
    if (!trialPriceId) {
      return res.status(500).json({ error: 'Trial price not configured. Set MYCARE_PRICE_TRIAL env var.' });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: trialPriceId }],
      metadata: {
        plan: 'trial',
        included_hours: trialHours.toString(),
        legacy_trial: 'true',
        created_via: 'admin_api',
      },
    });

    res.json({
      success: true,
      message: `Trial user created with ${trialHours} hour(s)`,
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      subscriptionId: subscription.id,
      includedHours: trialHours,
    });
  } catch (error) {
    console.error('Error creating trial user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Check customer status (for debugging)
app.get('/api/admin/check-customer', async (req, res) => {
  try {
    const { email, password } = req.query;

    // Verify password
    const correctPassword = process.env.ADMIN_PASSWORD || process.env.ASSISTANT_PASSWORD || 'mycarepa2024';
    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Unauthorized - password required as query param' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email query param is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Search for customer by email
    const customers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 10,
    });

    if (customers.data.length === 0) {
      // Try case-insensitive search by listing recent customers
      const recentCustomers = await stripe.customers.list({ limit: 100 });
      const matchingCustomer = recentCustomers.data.find(
        c => c.email && c.email.toLowerCase() === normalizedEmail
      );

      if (matchingCustomer) {
        return res.json({
          found: true,
          note: 'Found via case-insensitive search',
          customer: {
            id: matchingCustomer.id,
            email: matchingCustomer.email,
            name: matchingCustomer.name,
            created: new Date(matchingCustomer.created * 1000).toISOString(),
            metadata: matchingCustomer.metadata,
          }
        });
      }

      return res.json({
        found: false,
        searchedEmail: normalizedEmail,
        message: 'No customer found with this email in Stripe'
      });
    }

    // Get customer details and subscriptions
    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 5,
    });

    res.json({
      found: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: new Date(customer.created * 1000).toISOString(),
        metadata: customer.metadata,
      },
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        plan: sub.metadata.plan || 'unknown',
        includedHours: sub.metadata.included_hours || 'not set',
        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      })),
      hasActiveSubscription: subscriptions.data.some(s => s.status === 'active'),
    });
  } catch (error) {
    console.error('Error checking customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upgrade subscription (for existing subscribers)
app.post('/api/upgrade-subscription', async (req, res) => {
  try {
    const { customerId, newPlan } = req.body;

    if (!customerId || !newPlan) {
      return res.status(400).json({ error: 'Customer ID and new plan are required' });
    }

    const planKey = newPlan.toLowerCase();
    const planConfig = MYCARE_PRICES[planKey];

    if (!planConfig) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Get customer's active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscription = subscriptions.data[0];
    const currentPlan = subscription.metadata.plan || 'unknown';

    // Check if already on this plan
    if (currentPlan === planKey) {
      return res.status(400).json({
        error: 'Same plan',
        message: `You are already on the ${planConfig.name} plan.`
      });
    }

    // Get subscription items
    const items = subscription.items.data;

    // Build update items - replace base price and hourly price
    const updateItems = [];

    // Find and replace base price item
    const baseItem = items.find(item => !item.price.recurring?.usage_type);
    if (baseItem) {
      updateItems.push({
        id: baseItem.id,
        price: planConfig.base,
      });
    }

    // Find and replace hourly/metered price item
    const hourlyItem = items.find(item => item.price.recurring?.usage_type === 'metered');
    if (hourlyItem && planConfig.hourly) {
      updateItems.push({
        id: hourlyItem.id,
        price: planConfig.hourly,
      });
    } else if (!hourlyItem && planConfig.hourly) {
      // Add hourly price if upgrading from trial
      updateItems.push({
        price: planConfig.hourly,
      });
    }

    // Update subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: updateItems,
      proration_behavior: 'create_prorations', // Charge difference immediately
      metadata: {
        plan: planKey,
        included_hours: planConfig.includedHours.toString(),
        upgraded_from: currentPlan,
        upgraded_at: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      message: `Successfully upgraded to ${planConfig.name}!`,
      previousPlan: currentPlan,
      newPlan: planKey,
      includedHours: planConfig.includedHours,
      subscriptionId: updatedSubscription.id,
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
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
  console.log('  POST /api/admin/create-trial-user - Create legacy trial user (admin)');
  console.log('  GET  /api/health - Health check');
});
