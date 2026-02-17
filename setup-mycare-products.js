import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createMyCareProducts() {
  console.log('Creating My Care Personal Assistant™ products with usage-based billing...\n');

  // ============================================
  // STEP 1: Create a Billing Meter for hours tracking
  // ============================================
  console.log('Creating Billing Meter for hours tracking...');

  const meter = await stripe.billing.meters.create({
    display_name: 'Assistant Hours',
    event_name: 'assistant_hours_used',
    default_aggregation: {
      formula: 'sum',
    },
    customer_mapping: {
      type: 'by_id',
      event_payload_key: 'stripe_customer_id',
    },
    value_settings: {
      event_payload_key: 'hours',
    },
  });

  console.log(`✓ Billing Meter created: ${meter.id}\n`);

  // ============================================
  // FREE TRIAL - 3 hours included
  // ============================================
  const freeTrialProduct = await stripe.products.create({
    name: 'My Care Free Trial',
    description: '3 hours of personal assistant support - Try My Care for 1 month at no cost!',
    metadata: {
      included_hours: '3',
      plan_type: 'trial'
    }
  });

  // Free trial - flat rate $0
  const freeTrialPrice = await stripe.prices.create({
    product: freeTrialProduct.id,
    currency: 'usd',
    unit_amount: 0,
    recurring: {
      interval: 'month',
    },
    lookup_key: 'mycare_free_trial',
  });

  console.log('✓ Free Trial created');
  console.log(`  Product ID: ${freeTrialProduct.id}`);
  console.log(`  Price ID: ${freeTrialPrice.id}\n`);

  // ============================================
  // MY CARE STARTER - 5 hours/month base + metered overage
  // ============================================
  const starterProduct = await stripe.products.create({
    name: 'My Care Starter',
    description: 'Light, occasional support - Up to 5 hours per month of personal assistant support',
    metadata: {
      included_hours: '5',
      plan_type: 'starter'
    }
  });

  // Starter base price (monthly subscription for included hours)
  const starterBasePrice = await stripe.prices.create({
    product: starterProduct.id,
    currency: 'usd',
    unit_amount: 14900, // $149/month for 5 hours
    recurring: {
      interval: 'month',
    },
    lookup_key: 'mycare_starter_base',
  });

  // Starter metered price (for overage hours) - using meter
  const starterMeteredPrice = await stripe.prices.create({
    product: starterProduct.id,
    currency: 'usd',
    unit_amount: 3500, // $35/hour overage
    recurring: {
      interval: 'month',
      meter: meter.id,
      usage_type: 'metered',
    },
    billing_scheme: 'per_unit',
    lookup_key: 'mycare_starter_hourly',
  });

  console.log('✓ My Care Starter created');
  console.log(`  Product ID: ${starterProduct.id}`);
  console.log(`  Base Price ID: ${starterBasePrice.id} ($149/month for 5 hours)`);
  console.log(`  Metered Price ID: ${starterMeteredPrice.id} ($35/hour overage)\n`);

  // ============================================
  // MY CARE PLUS - 10 hours/month
  // ============================================
  const plusProduct = await stripe.products.create({
    name: 'My Care Plus',
    description: 'Regular guidance & follow-ups - Up to 10 hours per month with priority response',
    metadata: {
      included_hours: '10',
      plan_type: 'plus'
    }
  });

  const plusBasePrice = await stripe.prices.create({
    product: plusProduct.id,
    currency: 'usd',
    unit_amount: 27900, // $279/month for 10 hours
    recurring: {
      interval: 'month',
    },
    lookup_key: 'mycare_plus_base',
  });

  const plusMeteredPrice = await stripe.prices.create({
    product: plusProduct.id,
    currency: 'usd',
    unit_amount: 3200, // $32/hour overage
    recurring: {
      interval: 'month',
      meter: meter.id,
      usage_type: 'metered',
    },
    billing_scheme: 'per_unit',
    lookup_key: 'mycare_plus_hourly',
  });

  console.log('✓ My Care Plus created');
  console.log(`  Product ID: ${plusProduct.id}`);
  console.log(`  Base Price ID: ${plusBasePrice.id} ($279/month for 10 hours)`);
  console.log(`  Metered Price ID: ${plusMeteredPrice.id} ($32/hour overage)\n`);

  // ============================================
  // MY CARE PRO - 20+ hours/month
  // ============================================
  const proProduct = await stripe.products.create({
    name: 'My Care Pro',
    description: 'High-touch, ongoing support - 20+ hours per month with dedicated assistant',
    metadata: {
      included_hours: '20',
      plan_type: 'pro'
    }
  });

  const proBasePrice = await stripe.prices.create({
    product: proProduct.id,
    currency: 'usd',
    unit_amount: 49900, // $499/month for 20 hours
    recurring: {
      interval: 'month',
    },
    lookup_key: 'mycare_pro_base',
  });

  const proMeteredPrice = await stripe.prices.create({
    product: proProduct.id,
    currency: 'usd',
    unit_amount: 2800, // $28/hour overage
    recurring: {
      interval: 'month',
      meter: meter.id,
      usage_type: 'metered',
    },
    billing_scheme: 'per_unit',
    lookup_key: 'mycare_pro_hourly',
  });

  console.log('✓ My Care Pro created');
  console.log(`  Product ID: ${proProduct.id}`);
  console.log(`  Base Price ID: ${proBasePrice.id} ($499/month for 20 hours)`);
  console.log(`  Metered Price ID: ${proMeteredPrice.id} ($28/hour overage)\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('='.repeat(60));
  console.log('\n📋 Add these to your .env file:\n');
  console.log(`# My Care - Billing Meter`);
  console.log(`MYCARE_METER_ID=${meter.id}`);
  console.log(`MYCARE_METER_EVENT_NAME=assistant_hours_used`);
  console.log('');
  console.log(`# My Care - Products`);
  console.log(`MYCARE_PRODUCT_TRIAL=${freeTrialProduct.id}`);
  console.log(`MYCARE_PRODUCT_STARTER=${starterProduct.id}`);
  console.log(`MYCARE_PRODUCT_PLUS=${plusProduct.id}`);
  console.log(`MYCARE_PRODUCT_PRO=${proProduct.id}`);
  console.log('');
  console.log(`# My Care - Prices`);
  console.log(`MYCARE_PRICE_TRIAL=${freeTrialPrice.id}`);
  console.log(`MYCARE_PRICE_STARTER_BASE=${starterBasePrice.id}`);
  console.log(`MYCARE_PRICE_STARTER_HOURLY=${starterMeteredPrice.id}`);
  console.log(`MYCARE_PRICE_PLUS_BASE=${plusBasePrice.id}`);
  console.log(`MYCARE_PRICE_PLUS_HOURLY=${plusMeteredPrice.id}`);
  console.log(`MYCARE_PRICE_PRO_BASE=${proBasePrice.id}`);
  console.log(`MYCARE_PRICE_PRO_HOURLY=${proMeteredPrice.id}`);

  console.log('\n='.repeat(60));
  console.log('\n💡 PRICING STRUCTURE:');
  console.log('┌─────────────────┬───────────────┬──────────────┬─────────────┐');
  console.log('│ Plan            │ Monthly Fee   │ Included Hrs │ Overage/Hr  │');
  console.log('├─────────────────┼───────────────┼──────────────┼─────────────┤');
  console.log('│ Free Trial      │ $0            │ 3 hours      │ N/A         │');
  console.log('│ Starter         │ $149          │ 5 hours      │ $35/hr      │');
  console.log('│ Plus            │ $279          │ 10 hours     │ $32/hr      │');
  console.log('│ Pro             │ $499          │ 20 hours     │ $28/hr      │');
  console.log('└─────────────────┴───────────────┴──────────────┴─────────────┘');

  console.log('\n📊 TO REPORT USAGE (hours used):');
  console.log(`
stripe.billing.meterEvents.create({
  event_name: 'assistant_hours_used',
  payload: {
    stripe_customer_id: 'cus_xxx',
    value: '2.5',  // hours used
  },
  timestamp: Math.floor(Date.now() / 1000),
});
`);

  console.log('✅ All products created successfully!\n');
}

createMyCareProducts().catch(console.error);
