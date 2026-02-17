/**
 * MY CARE PERSONAL ASSISTANT - USAGE TRACKING EXAMPLES
 *
 * This file shows different ways to track and report assistant hours to Stripe.
 */

import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const METER_EVENT_NAME = process.env.MYCARE_METER_EVENT_NAME || 'assistant_hours_used';

// ============================================
// OPTION 1: Simple Manual Logging
// Call this when a session ends
// ============================================
async function reportSessionHours(customerId, hours, sessionNotes = '') {
  const meterEvent = await stripe.billing.meterEvents.create({
    event_name: METER_EVENT_NAME,
    payload: {
      stripe_customer_id: customerId,
      value: hours.toString(),
    },
    timestamp: Math.floor(Date.now() / 1000),
  });

  console.log(`Reported ${hours} hours for customer ${customerId}`);
  return meterEvent;
}

// ============================================
// OPTION 2: Session Timer Class
// Start/stop timer for each session
// ============================================
class SessionTimer {
  constructor(customerId) {
    this.customerId = customerId;
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = new Date();
    console.log(`Session started for ${this.customerId} at ${this.startTime}`);
    return this;
  }

  async end() {
    this.endTime = new Date();
    const durationMs = this.endTime - this.startTime;
    const hours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals

    // Minimum billing increment: 15 minutes (0.25 hours)
    const billableHours = Math.max(0.25, Math.ceil(hours * 4) / 4);

    console.log(`Session ended. Duration: ${hours} hours, Billable: ${billableHours} hours`);

    // Report to Stripe
    await reportSessionHours(this.customerId, billableHours);

    return {
      startTime: this.startTime,
      endTime: this.endTime,
      actualHours: hours,
      billableHours: billableHours,
    };
  }
}

// ============================================
// OPTION 3: Database-backed Session Tracking
// For production use with persistence
// ============================================
class SessionTracker {
  constructor(db) {
    this.db = db; // Your database connection (Supabase, etc.)
  }

  async startSession(customerId, assistantId) {
    const session = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      assistant_id: assistantId,
      start_time: new Date().toISOString(),
      end_time: null,
      hours: null,
      reported_to_stripe: false,
    };

    // Save to database
    // await this.db.from('sessions').insert(session);

    console.log('Session created:', session.id);
    return session;
  }

  async endSession(sessionId) {
    const endTime = new Date();

    // Get session from database
    // const session = await this.db.from('sessions').select().eq('id', sessionId).single();

    // Calculate hours
    // const startTime = new Date(session.start_time);
    // const hours = (endTime - startTime) / (1000 * 60 * 60);

    // Update database
    // await this.db.from('sessions').update({ end_time: endTime, hours }).eq('id', sessionId);

    return { sessionId, endTime };
  }

  async reportUnreportedSessions() {
    // Get all completed but unreported sessions
    // const sessions = await this.db.from('sessions')
    //   .select()
    //   .not('end_time', 'is', null)
    //   .eq('reported_to_stripe', false);

    // for (const session of sessions) {
    //   await reportSessionHours(session.customer_id, session.hours);
    //   await this.db.from('sessions').update({ reported_to_stripe: true }).eq('id', session.id);
    // }
  }
}

// ============================================
// OPTION 4: Webhook-based (Calendly, etc.)
// Automatically track from scheduling tools
// ============================================
async function handleCalendlyWebhook(event) {
  if (event.event === 'invitee.canceled') {
    return; // No charge for canceled
  }

  if (event.event === 'invitee.created') {
    // Meeting scheduled - could pre-authorize
    const duration = event.payload.scheduled_event.duration; // in minutes
    const customerId = event.payload.tracking.customer_id; // Pass via UTM params

    console.log(`Meeting scheduled: ${duration} minutes for ${customerId}`);
  }

  if (event.event === 'meeting.ended') {
    // Meeting completed - report actual duration
    const actualDuration = event.payload.actual_duration; // in minutes
    const hours = actualDuration / 60;
    const customerId = event.payload.tracking.customer_id;

    await reportSessionHours(customerId, hours);
  }
}

// ============================================
// OPTION 5: Daily/Weekly Batch Reporting
// For manual time tracking systems
// ============================================
async function batchReportUsage(entries) {
  // entries = [{ customerId: 'cus_xxx', hours: 2, date: '2025-01-15', notes: 'Call about taxes' }]

  for (const entry of entries) {
    await stripe.billing.meterEvents.create({
      event_name: METER_EVENT_NAME,
      payload: {
        stripe_customer_id: entry.customerId,
        value: entry.hours.toString(),
      },
      // Use the actual date of service
      timestamp: Math.floor(new Date(entry.date).getTime() / 1000),
    });

    console.log(`Reported ${entry.hours}h for ${entry.customerId} on ${entry.date}`);
  }
}

// ============================================
// HELPER: Get Customer Usage Summary
// ============================================
async function getCustomerUsage(customerId, subscriptionId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodStart = subscription.current_period_start;
  const periodEnd = subscription.current_period_end;
  const includedHours = parseInt(subscription.metadata.included_hours || '0');

  const meterSummary = await stripe.billing.meters.listEventSummaries(
    process.env.MYCARE_METER_ID,
    {
      customer: customerId,
      start_time: periodStart,
      end_time: Math.floor(Date.now() / 1000),
    }
  );

  const usedHours = meterSummary.data.reduce(
    (sum, e) => sum + parseFloat(e.aggregated_value),
    0
  );

  return {
    plan: subscription.metadata.plan,
    periodStart: new Date(periodStart * 1000),
    periodEnd: new Date(periodEnd * 1000),
    includedHours,
    usedHours,
    remainingHours: Math.max(0, includedHours - usedHours),
    overageHours: Math.max(0, usedHours - includedHours),
  };
}

// ============================================
// USAGE EXAMPLES
// ============================================
async function examples() {
  const customerId = 'cus_example123';

  // Example 1: Simple report
  // await reportSessionHours(customerId, 1.5);

  // Example 2: Using timer
  // const timer = new SessionTimer(customerId);
  // timer.start();
  // // ... session happens ...
  // await timer.end();

  // Example 3: Batch report
  // await batchReportUsage([
  //   { customerId, hours: 2, date: '2025-02-15', notes: 'Initial consultation' },
  //   { customerId, hours: 1.5, date: '2025-02-16', notes: 'Follow-up call' },
  // ]);

  // Example 4: Check usage
  // const usage = await getCustomerUsage(customerId, 'sub_xxx');
  // console.log(`Used ${usage.usedHours} of ${usage.includedHours} hours`);
}

export {
  reportSessionHours,
  SessionTimer,
  SessionTracker,
  batchReportUsage,
  getCustomerUsage,
};
