# My Care Personal Assistant - Demo Material

## What is MyCarePA?

MyCarePA provides dedicated personal assistant services on a subscription basis. Members get a set number of hours each month with their personal assistant, with transparent usage tracking and flexible plans.

---

## Key Features

### 1. Simple Subscription Plans

| Plan | Monthly | Included Hours | Best For |
|------|---------|----------------|----------|
| **Trial** | $0 | 3 hours | Try before you buy |
| **Starter** | $99 | 4 hours | Light administrative tasks |
| **Plus** | $249 | 10 hours | Regular ongoing support |
| **Pro** | $499 | 20 hours | Heavy daily assistance |

### 2. Metered Billing (Pay For What You Use)

- **Included hours** come with your plan
- **Overage hours** billed automatically if you go over:
  - Starter: $35/hour overage
  - Plus: $32/hour overage
  - Pro: $28/hour overage
- No surprises - usage tracked in real-time

### 3. Easy Scheduling

- **Calendly integration** for instant booking
- Book meetings directly from your dashboard
- See your remaining hours before scheduling
- Email verification for secure access

### 4. Real-Time Usage Tracking

Members can see at any time:
- Hours remaining this billing period
- Hours used so far
- Plan details and renewal date

---

## How It Works

### For New Members

```
1. Visit mycarepersonalassistant.com
2. Choose a plan (Trial, Starter, Plus, or Pro)
3. Complete checkout via Stripe (secure payment)
4. Schedule your first meeting with your assistant
5. Bookmark /schedule for future bookings
```

### For Returning Members

```
1. Go to /schedule
2. Enter your email
3. Receive verification code
4. See your remaining hours
5. Book a meeting if hours available
```

### For Assistants

```
1. Log into /assistant dashboard
2. Search for customer by name or email
3. View customer's plan and hours
4. Log hours used after completing tasks
```

---

## Metered Billing Explained

### What is Metered Billing?

Instead of paying upfront for hours you might not use, metered billing tracks your actual usage and bills accordingly.

### How Usage is Tracked

1. **Assistant logs hours** after completing work
2. **Stripe Meter** records the usage event
3. **At billing cycle end**, Stripe calculates:
   - If under included hours → No extra charge
   - If over included hours → Overage billed at plan rate

### Example: Plus Plan ($249/month, 10 hours included)

| Scenario | Hours Used | Monthly Bill |
|----------|------------|--------------|
| Under limit | 8 hours | $249 (base only) |
| At limit | 10 hours | $249 (base only) |
| Over limit | 13 hours | $249 + (3 × $32) = $345 |

### Benefits

- **Flexibility**: Use more hours when you need them
- **Transparency**: See exactly what you're paying for
- **No waste**: Don't pay for unused hours upfront
- **Predictable base**: Know your minimum monthly cost

---

## Security Features

- **Email verification** - 6-digit codes sent to registered email
- **Secure payments** - Stripe handles all payment processing
- **Password-protected** assistant dashboard
- **Session management** - Auto-logout after inactivity

---

## Technical Highlights

- **Stripe Billing** - Enterprise-grade subscription management
- **Stripe Meters** - Real-time usage tracking
- **Calendly** - Professional scheduling
- **Resend** - Reliable email delivery
- **Railway** - Scalable cloud hosting

---

## Demo Script

### 1. Homepage Tour (2 min)
- Show pricing cards
- Highlight included hours vs overage rates
- Point out the "Start Free Trial" option

### 2. Checkout Flow (2 min)
- Click "Get Started" on any plan
- Show Stripe checkout page
- Explain secure payment processing

### 3. Success & Booking (2 min)
- After payment, show success page
- Demonstrate Calendly popup
- Show prefilled name/email

### 4. Member Portal (3 min)
- Go to /schedule
- Enter email, show verification code
- Display hours remaining
- Book a meeting

### 5. Assistant Dashboard (3 min)
- Log into /assistant
- Search for a customer
- Show customer details and plan
- Log usage hours
- Show updated remaining hours

---

## FAQ for Demo

**Q: What happens if I use all my hours?**
A: You can still book meetings. Additional hours are billed at your plan's overage rate.

**Q: Can I upgrade my plan mid-month?**
A: Yes! Contact support and we'll prorate the difference.

**Q: How do I know how many hours I've used?**
A: Check /schedule anytime - your usage is displayed after verification.

**Q: Is my payment information secure?**
A: Yes, all payments are processed by Stripe, a PCI-compliant payment processor. We never see your card details.

**Q: Can I cancel anytime?**
A: Yes, subscriptions can be cancelled anytime. You'll retain access until the end of your billing period.

---

## Contact

- **Website**: mycarepersonalassistant.com
- **Email**: support@mycarepa.com
