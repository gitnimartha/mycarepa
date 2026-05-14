#!/usr/bin/env node
/**
 * Batch Add Trial Users Script
 * Usage: node scripts/add-trial-users.js "path/to/file.csv"
 *
 * Auto-detects columns containing "email", "first", "last" in headers
 * Runs 20 concurrent requests for speed
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'https://api.mycarepersonalassistant.com/api/admin/create-trial-user';
const PASSWORD = 'mycarepa2024';
const HOURS = 3;
const CONCURRENCY = 20; // Number of parallel requests

// Get CSV path from command line
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/add-trial-users.js "path/to/file.csv"');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  process.exit(1);
}

// Parse CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);

  // Find column indices (case-insensitive, partial match)
  const emailIdx = headers.findIndex(h => h.toLowerCase().includes('email'));
  const firstIdx = headers.findIndex(h => h.toLowerCase().includes('first'));
  const lastIdx = headers.findIndex(h => h.toLowerCase().includes('last'));

  if (emailIdx === -1) {
    console.error('Could not find email column in headers:', headers);
    process.exit(1);
  }

  console.log(`Detected columns - Email: "${headers[emailIdx]}", First: "${headers[firstIdx] || 'N/A'}", Last: "${headers[lastIdx] || 'N/A'}"`);

  const users = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const email = (cols[emailIdx] || '').trim();
    const firstName = firstIdx >= 0 ? (cols[firstIdx] || '').trim() : '';
    const lastName = lastIdx >= 0 ? (cols[lastIdx] || '').trim() : '';

    if (email && email.includes('@')) {
      users.push({
        email,
        name: [firstName, lastName].filter(Boolean).join(' ') || 'Trial User'
      });
    }
  }

  return users;
}

// Handle CSV with quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Make API request
async function createTrialUser(user) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        hours: HOURS,
        password: PASSWORD
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, user, data };
    } else {
      return { success: false, user, error: data.error || 'Unknown error' };
    }
  } catch (err) {
    return { success: false, user, error: err.message };
  }
}

// Process in batches
async function processBatch(users, startIdx) {
  const promises = users.map((user, i) =>
    createTrialUser(user).then(result => ({ ...result, index: startIdx + i }))
  );
  return Promise.all(promises);
}

// Main
async function main() {
  console.log(`\nReading: ${csvPath}\n`);

  const content = fs.readFileSync(csvPath, 'utf-8');
  // Remove BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '');
  const users = parseCSV(cleanContent);

  console.log(`Found ${users.length} users to process\n`);

  if (users.length === 0) {
    console.log('No users found.');
    return;
  }

  // Prepare log files
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const baseName = path.basename(csvPath, path.extname(csvPath));
  const logDir = path.dirname(csvPath);
  const successLog = path.join(logDir, `${baseName}-success-${timestamp}.csv`);
  const errorLog = path.join(logDir, `${baseName}-errors-${timestamp}.csv`);

  fs.writeFileSync(successLog, 'Email,Name,CustomerId,SubscriptionId\n');
  fs.writeFileSync(errorLog, 'Email,Name,Error\n');

  let success = 0;
  let failed = 0;
  let skipped = 0;

  // Process in batches
  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const batch = users.slice(i, i + CONCURRENCY);
    const results = await processBatch(batch, i);

    for (const result of results) {
      const num = result.index + 1;
      const { email, name } = result.user;

      if (result.success) {
        process.stdout.write(`[${num}/${users.length}] ${email} - OK\n`);
        fs.appendFileSync(successLog, `"${email}","${name}","${result.data.customerId}","${result.data.subscriptionId}"\n`);
        success++;
      } else if (result.error.includes('already has')) {
        process.stdout.write(`[${num}/${users.length}] ${email} - SKIPPED (existing)\n`);
        skipped++;
      } else {
        process.stdout.write(`[${num}/${users.length}] ${email} - FAILED: ${result.error}\n`);
        fs.appendFileSync(errorLog, `"${email}","${name}","${result.error}"\n`);
        failed++;
      }
    }
  }

  console.log(`\n========== COMPLETE ==========`);
  console.log(`Total:   ${users.length}`);
  console.log(`Success: ${success}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed:  ${failed}`);
  console.log(`\nLogs saved to:`);
  console.log(`  Success: ${successLog}`);
  console.log(`  Errors:  ${errorLog}`);
}

main().catch(console.error);
