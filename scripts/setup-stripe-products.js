/**
 * Setup Stripe Products, Prices, and Billing Meter for MyCarePA
 *
 * Usage: node setup-stripe-products.js <STRIPE_SECRET_KEY>
 */

const stripeSecretKey = process.argv[2];

if (!stripeSecretKey) {
  console.error('ERROR: Stripe secret key is required');
  console.error('Usage: node setup-stripe-products.js sk_live_...');
  process.exit(1);
}

const stripe = require('stripe')(stripeSecretKey);
const fs = require('fs');
const path = require('path');

// Plan configuration
const plans = [
  {
    name: 'Trial',
    key: 'TRIAL',
    description: 'Try My Care Personal Assistant',
    basePrice: 0,
    includedHours: 1,
    hourlyRate: null, // No overage for trial
  },
  {
    name: 'Starter',
    key: 'STARTER',
    description: 'Perfect for occasional assistance',
    basePrice: 9900, // $99 in cents
    includedHours: 4,
    hourlyRate: 3500, // $35/hr
  },
  {
    name: 'Plus',
    key: 'PLUS',
    description: 'Great for regular support needs',
    basePrice: 24900, // $249 in cents
    includedHours: 10,
    hourlyRate: 3200, // $32/hr
  },
  {
    name: 'Pro',
    key: 'PRO',
    description: 'Best value for comprehensive assistance',
    basePrice: 49900, // $499 in cents
    includedHours: 20,
    hourlyRate: 2800, // $28/hr
  },
];

async function setup() {
  const ids = {};

  console.log('Creating Stripe resources...\n');

  // 1. Create Billing Meter
  console.log('Creating Billing Meter...');
  const meter = await stripe.billing.meters.create({
    display_name: 'My Care Assistant Hours',
    event_name: 'assistant_hours_used',
    default_aggregation: { formula: 'sum' },
    customer_mapping: {
      event_payload_key: 'stripe_customer_id',
      type: 'by_id',
    },
    value_settings: {
      event_payload_key: 'hours',
    },
  });
  ids['MYCARE_METER_ID'] = meter.id;
  console.log(`  Created meter: ${meter.id}`);

  // 2. Create Products and Prices
  for (const plan of plans) {
    console.log(`\nCreating ${plan.name} plan...`);

    // Create Product
    const product = await stripe.products.create({
      name: `My Care PA - ${plan.name}`,
      description: plan.description,
      metadata: {
        plan: plan.key.toLowerCase(),
        included_hours: plan.includedHours.toString(),
      },
    });
    ids[`MYCARE_PRODUCT_${plan.key}`] = product.id;
    console.log(`  Product: ${product.id}`);

    // Create Base Price (monthly subscription)
    if (plan.basePrice === 0) {
      // Trial - free price
      const trialPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: 0,
        recurring: { interval: 'month' },
        metadata: {
          plan: plan.key.toLowerCase(),
          type: 'base',
          included_hours: plan.includedHours.toString(),
        },
      });
      ids[`MYCARE_PRICE_${plan.key}`] = trialPrice.id;
      console.log(`  Base Price: ${trialPrice.id}`);
    } else {
      // Paid plans - base + hourly
      const basePrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: plan.basePrice,
        recurring: { interval: 'month' },
        metadata: {
          plan: plan.key.toLowerCase(),
          type: 'base',
          included_hours: plan.includedHours.toString(),
        },
      });
      ids[`MYCARE_PRICE_${plan.key}_BASE`] = basePrice.id;
      console.log(`  Base Price: ${basePrice.id}`);

      // Create Hourly Price (metered)
      const hourlyPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: plan.hourlyRate,
        recurring: {
          interval: 'month',
          usage_type: 'metered',
          meter: meter.id,
        },
        metadata: {
          plan: plan.key.toLowerCase(),
          type: 'hourly',
        },
      });
      ids[`MYCARE_PRICE_${plan.key}_HOURLY`] = hourlyPrice.id;
      console.log(`  Hourly Price: ${hourlyPrice.id}`);
    }
  }

  // Write IDs to temp file for batch script
  const tempFile = path.join(__dirname, 'stripe-ids.tmp');
  const content = Object.entries(ids)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(tempFile, content);

  console.log('\n==========================================');
  console.log('  Stripe Setup Complete!');
  console.log('==========================================\n');

  console.log('Created IDs:');
  for (const [key, value] of Object.entries(ids)) {
    console.log(`  ${key}=${value}`);
  }

  console.log('\nIDs saved to stripe-ids.tmp');
}

setup().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
