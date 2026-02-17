import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  console.log('Creating Stripe products and prices...\n');

  // Starter Plan
  const starterProduct = await stripe.products.create({
    name: 'Starter Plan',
    description: 'Up to 10 team members, 5GB storage, Basic analytics, Email support, Mobile app access, API access',
  });

  const starterMonthly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 2900,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'starter_monthly',
  });

  const starterAnnual = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 27600,
    currency: 'usd',
    recurring: { interval: 'year' },
    lookup_key: 'starter_annual',
  });

  console.log('✓ Starter Plan created');
  console.log(`  Product ID: ${starterProduct.id}`);
  console.log(`  Monthly Price ID: ${starterMonthly.id}`);
  console.log(`  Annual Price ID: ${starterAnnual.id}\n`);

  // Professional Plan
  const proProduct = await stripe.products.create({
    name: 'Professional Plan',
    description: 'Up to 50 team members, 50GB storage, Advanced analytics, Priority email support, Custom integrations, Advanced security',
  });

  const proMonthly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 7900,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'professional_monthly',
  });

  const proAnnual = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 75600,
    currency: 'usd',
    recurring: { interval: 'year' },
    lookup_key: 'professional_annual',
  });

  console.log('✓ Professional Plan created');
  console.log(`  Product ID: ${proProduct.id}`);
  console.log(`  Monthly Price ID: ${proMonthly.id}`);
  console.log(`  Annual Price ID: ${proAnnual.id}\n`);

  // Enterprise Plan
  const enterpriseProduct = await stripe.products.create({
    name: 'Enterprise Plan',
    description: 'Unlimited team members, Unlimited storage, Enterprise analytics, 24/7 support, Dedicated account manager, Custom SLA',
  });

  const enterpriseMonthly = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 19900,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'enterprise_monthly',
  });

  const enterpriseAnnual = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 190800,
    currency: 'usd',
    recurring: { interval: 'year' },
    lookup_key: 'enterprise_annual',
  });

  console.log('✓ Enterprise Plan created');
  console.log(`  Product ID: ${enterpriseProduct.id}`);
  console.log(`  Monthly Price ID: ${enterpriseMonthly.id}`);
  console.log(`  Annual Price ID: ${enterpriseAnnual.id}\n`);

  console.log('='.repeat(50));
  console.log('\nAdd these to your .env file:\n');
  console.log(`STRIPE_PRICE_STARTER_MONTHLY=${starterMonthly.id}`);
  console.log(`STRIPE_PRICE_STARTER_ANNUAL=${starterAnnual.id}`);
  console.log(`STRIPE_PRICE_PROFESSIONAL_MONTHLY=${proMonthly.id}`);
  console.log(`STRIPE_PRICE_PROFESSIONAL_ANNUAL=${proAnnual.id}`);
  console.log(`STRIPE_PRICE_ENTERPRISE_MONTHLY=${enterpriseMonthly.id}`);
  console.log(`STRIPE_PRICE_ENTERPRISE_ANNUAL=${enterpriseAnnual.id}`);
}

createProducts().catch(console.error);
