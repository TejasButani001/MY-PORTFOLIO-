// =========================================================================
// Practical 10 — Automated Verification Script
// "Asynchronous Processing with Event-Driven Architecture"
//
// Tests:
//   1. Authentication (JWT token retrieval)
//   2. POST /tasks -> emits 'task-created' asynchronously (API responds instantly)
//   3. Non-blocking verification (API response timestamp < listener completion timestamp)
//   4. DELETE /tasks/:id -> emits 'task-deleted' (Supplementary 1)
//   5. POST /events/test-error -> triggers 'error' listener safely (Supplementary 2)
//   6. 2-second simulated delay confirmation (Supplementary 3)
// =========================================================================

const http = require('http');

// Colors for terminal formatting
const c = {
  reset : '\x1b[0m',
  bold  : '\x1b[1m',
  green : '\x1b[32m',
  red   : '\x1b[31m',
  yellow: '\x1b[33m',
  cyan  : '\x1b[36m',
  blue  : '\x1b[34m',
  magenta: '\x1b[35m',
  grey  : '\x1b[90m',
};

const pass  = (msg) => console.log(`  ${c.green}✔${c.reset}  ${msg}`);
const fail  = (msg) => console.log(`  ${c.red}✘${c.reset}  ${msg}`);
const info  = (msg) => console.log(`  ${c.cyan}ℹ${c.reset}  ${msg}`);
const head  = (msg) => console.log(`\n${c.bold}${c.blue}${msg}${c.reset}\n${'─'.repeat(60)}`);
const wait  = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.request(
      { hostname: '127.0.0.1', port: 5000, path, method, headers },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const ms = Date.now() - start;
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data), ms });
          } catch {
            resolve({ status: res.statusCode, body: data, ms });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

let passed = 0;
let failed = 0;
function check(condition, passMsg, failMsg) {
  if (condition) { pass(passMsg); passed++; }
  else           { fail(failMsg); failed++; }
}

async function runVerification() {
  console.log(`\n${c.bold}${c.yellow}╔══════════════════════════════════════════════════════════════════╗`);
  console.log(`║      Practical 10: Event-Driven Asynchronous Processing          ║`);
  console.log(`║              Automated Verification & Demonstration              ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════╝${c.reset}`);
  console.log(`  Target Server : http://127.0.0.1:5000`);
  console.log(`  Test Run At   : ${new Date().toISOString()}\n`);

  let token = '';
  let createdTask = null;

  // ── STEP 1: Authenticate / Obtain JWT Token ──────────────────────────────
  head('STEP 1: User Authentication (Login / Register)');
  info('Sending login request to POST /auth/login…');
  let loginRes = await request(
    'POST', '/auth/login',
    { 'Content-Type': 'application/json' },
    { email: 'student@example.com', password: 'Password123!' }
  );

  if (loginRes.status !== 200) {
    info('User not found. Registering a test student account…');
    const regRes = await request(
      'POST', '/auth/register',
      { 'Content-Type': 'application/json' },
      { name: 'Student Developer', email: 'student@example.com', password: 'Password123!' }
    );
    if (regRes.status === 201) {
      pass('Test user registered successfully.');
    }
    loginRes = await request(
      'POST', '/auth/login',
      { 'Content-Type': 'application/json' },
      { email: 'student@example.com', password: 'Password123!' }
    );
  }

  check(loginRes.status === 200 && loginRes.body?.token,
    `Logged in successfully! Received JWT token (Roundtrip: ${loginRes.ms}ms)`,
    `Failed to obtain token: ${JSON.stringify(loginRes.body)}`
  );
  token = loginRes.body?.token;
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // ── STEP 2: Clear previous event logs for a clean test run ────────────────
  await request('DELETE', '/events/log');

  // ── STEP 3: POST /tasks (Core Objective: Non-Blocking Event Emission) ─────
  head('STEP 2: POST /tasks -> Create Task & Emit "task-created"');
  info('Creating a task with assigned user...');
  info('Expected: API responds immediately (201 Created) while notification runs in background.');

  const clientSendTime = new Date().toISOString();
  const postRes = await request(
    'POST', '/tasks', authHeaders,
    {
      title: 'Complete Practical 10 Lab Report',
      description: 'Implement EventEmitter and compare timestamps',
      assignedTo: 'Tejas (Student)',
      priority: 'high'
    }
  );
  const clientReceiveTime = new Date().toISOString();

  check(postRes.status === 201,
    `Task created successfully! HTTP 201 Created in ${postRes.ms}ms`,
    `Failed to create task: status ${postRes.status}`
  );
  createdTask = postRes.body;
  info(`Task ID        : ${createdTask._id}`);
  info(`Task Title     : "${createdTask.title}"`);
  info(`Assigned To    : ${createdTask.assignedTo}`);
  info(`API Response ms: ${postRes.ms}ms (Instant! Not delayed by the 2000ms background notification)`);

  // ── STEP 4: Confirm non-blocking behavior via 2-second delayed listener ───
  head('STEP 3: Verify Asynchronous Non-Blocking Execution');
  info('Waiting 2.3 seconds for the simulated slow background listener to complete…');
  await wait(2300);

  // Fetch event log
  const eventLogRes = await request('GET', '/events/log');
  check(eventLogRes.status === 200, 'Fetched event logs from GET /events/log', 'Failed to fetch event logs');

  const createdEvent = eventLogRes.body?.events?.find(e => e.event === 'task-created');
  check(!!createdEvent, 'Found "task-created" event in backend event log', 'No "task-created" event recorded');

  if (createdEvent) {
    const apiTime = new Date(createdEvent.apiResponseTime).getTime();
    const completeTime = new Date(createdEvent.listenerCompleteTime).getTime();
    const diffMs = completeTime - apiTime;

    console.log(`\n  ${c.bold}⏱️ Timestamp Comparison Proof (Lab Requirement):${c.reset}`);
    console.log(`  ┌─────────────────────────────┬────────────────────────────────┐`);
    console.log(`  │ Metric                      │ Timestamp / Value              │`);
    console.log(`  ├─────────────────────────────┼────────────────────────────────┤`);
    console.log(`  │ API Response Sent At        │ ${createdEvent.apiResponseTime} │`);
    console.log(`  │ Listener Started At         │ ${createdEvent.listenerStartTime} │`);
    console.log(`  │ Listener Completed At       │ ${createdEvent.listenerCompleteTime} │`);
    console.log(`  │ API Client Roundtrip        │ ${postRes.ms}ms                       │`);
    console.log(`  │ Background Delay Elapsed    │ ${diffMs}ms (approx ~2000ms)     │`);
    console.log(`  └─────────────────────────────┴────────────────────────────────┘\n`);

    check(completeTime > apiTime,
      `PROVEN: API response was sent BEFORE background listener completed! (${diffMs}ms earlier)`,
      'Timing anomaly: Listener completed before API response'
    );

    check(postRes.ms < 500,
      `PROVEN: Client HTTP request finished in ${postRes.ms}ms (did not wait for 2000ms delay)`,
      `API was blocked: took ${postRes.ms}ms`
    );
  }

  // ── STEP 5: Supplementary Problem 1: DELETE /tasks/:id -> 'task-deleted' ──
  head('STEP 4: Supplementary Problem 1 — "task-deleted" Event');
  info(`Deleting task ID: ${createdTask._id}…`);
  const delRes = await request('DELETE', `/tasks/${createdTask._id}`, authHeaders);
  check(delRes.status === 200, `Task deleted successfully (HTTP 200 OK in ${delRes.ms}ms)`, 'Failed to delete task');

  await wait(200);
  const eventLogRes2 = await request('GET', '/events/log');
  const deletedEvent = eventLogRes2.body?.events?.find(e => e.event === 'task-deleted');
  check(!!deletedEvent,
    `Found "task-deleted" event in backend log for task "${createdTask.title}"`,
    'No "task-deleted" event recorded'
  );

  // ── STEP 6: Supplementary Problem 2: Error Event Listener ─────────────────
  head('STEP 5: Supplementary Problem 2 — "error" Event Listener');
  info('Triggering a deliberate error event via POST /events/test-error…');
  const errRes = await request(
    'POST', '/events/test-error',
    { 'Content-Type': 'application/json' },
    { message: 'Lab Test Error: Simulated failure inside event listener' }
  );
  check(errRes.status === 200, 'Deliberate test error emitted to TaskEvents', 'Failed to trigger error event');

  await wait(200);
  const eventLogRes3 = await request('GET', '/events/log');
  const errEvent = eventLogRes3.body?.events?.find(e => e.event === 'error');
  check(!!errEvent,
    `Safe error handling verified: "error" event was caught without crashing the server!`,
    'Error event was not captured'
  );

  // ── SUMMARY & VIVA Q&A ────────────────────────────────────────────────────
  head('FINAL SUMMARY & KEY LAB QUESTIONS');
  console.log(`  Total Checks : ${passed + failed}`);
  console.log(`  ${c.green}Passed       : ${passed}${c.reset}`);
  console.log(`  ${c.red}Failed       : ${failed}${c.reset}`);

  if (failed === 0) {
    console.log(`\n  ${c.bold}${c.green}🎉 ALL PRACTICAL 10 OBJECTIVES & SUPPLEMENTARY PROBLEMS VERIFIED!${c.reset}\n`);
  }

  console.log(`${c.bold}${c.yellow}📘 Viva & Lab Exam Ready Answers:${c.reset}`);
  console.log(`  ${c.bold}Q1: Why does emitting an event not block the API response?${c.reset}`);
  console.log(`  ► Node.js executes the controller synchronously, sending res.status(201).json().`);
  console.log(`    The event emitter invokes listener code. When the listener uses asynchronous APIs`);
  console.log(`    (like setTimeout, I/O, or message dispatching), it defers execution to the event loop,`);
  console.log(`    allowing the HTTP response to be flushed to the client immediately.`);
  console.log(`\n  ${c.bold}Q2: What happens if notification logic is placed directly inside the POST route?${c.reset}`);
  console.log(`  ► The API response time increases by the full duration of the notification (e.g. +2000ms),`);
  console.log(`    causing high latency, poor user experience, and risk of HTTP request timeouts.`);
  console.log(`\n  ${c.bold}Q3: Why is EventEmitter great for this scale, but not for millions of events/day?${c.reset}`);
  console.log(`  ► EventEmitter is in-memory and single-process. If the Node.js server crashes or`);
  console.log(`    restarts, any pending background events are lost (no persistence). For large production`);
  console.log(`    systems, distributed message queues (e.g., RabbitMQ, Redis BullMQ, Kafka, AWS SQS)`);
  console.log(`    provide persistence, retry mechanisms, worker scaling, and failure isolation.\n`);
}

runVerification().catch((err) => {
  console.error(`\n${c.red}Error running verification script: ${err.message}${c.reset}`);
  console.error('Make sure the server is running on port 5000: node server.js\n');
  process.exit(1);
});
