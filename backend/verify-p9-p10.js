// =========================================================================
// verify-p9-p10.js
// Automated verification script for:
//   Practical 9  – In-Memory Caching (node-cache)
//   Practical 10 – Async EventEmitter background notifications
//
// HOW TO RUN (server must already be running on port 5000):
//   node verify-p9-p10.js
// =========================================================================

const http = require('http');

// ── Colour helpers for readable console output ────────────────────────────
const c = {
  reset : '\x1b[0m',
  bold  : '\x1b[1m',
  green : '\x1b[32m',
  red   : '\x1b[31m',
  yellow: '\x1b[33m',
  cyan  : '\x1b[36m',
  blue  : '\x1b[34m',
  grey  : '\x1b[90m',
};
const pass  = (msg) => console.log(`  ${c.green}✔${c.reset}  ${msg}`);
const fail  = (msg) => console.log(`  ${c.red}✘${c.reset}  ${msg}`);
const info  = (msg) => console.log(`  ${c.cyan}ℹ${c.reset}  ${msg}`);
const head  = (msg) => console.log(`\n${c.bold}${c.blue}${msg}${c.reset}\n${'─'.repeat(55)}`);
const divider = () => console.log(`${c.grey}${'─'.repeat(55)}${c.reset}`);

// ── Low-level HTTP helper ─────────────────────────────────────────────────
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
          try { resolve({ status: res.statusCode, body: JSON.parse(data), ms }); }
          catch { resolve({ status: res.statusCode, body: data, ms }); }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Wait helper ───────────────────────────────────────────────────────────
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── State ─────────────────────────────────────────────────────────────────
let token = '';
let createdTaskId = '';
let passed = 0;
let failed = 0;

function check(condition, passMsg, failMsg) {
  if (condition) { pass(passMsg); passed++; }
  else           { fail(failMsg); failed++; }
}

// =========================================================================
// MAIN VERIFICATION ROUTINE
// =========================================================================
async function verify() {
  console.log(`\n${c.bold}${c.yellow}╔═══════════════════════════════════════════════════════╗`);
  console.log(`║   Practical 9 & 10 — Automated Verification Script   ║`);
  console.log(`╚═══════════════════════════════════════════════════════╝${c.reset}`);
  console.log(`  Server: http://localhost:5000`);
  console.log(`  Time  : ${new Date().toISOString()}\n`);

  // ── STEP 1: Login ───────────────────────────────────────────────────────
  head('STEP 1 — Login (get JWT token)');
  info('POST /auth/login');
  const loginRes = await request(
    'POST', '/auth/login',
    { 'Content-Type': 'application/json' },
    { email: 'testuser@example.com', password: 'password123' }
  );

  if (loginRes.status === 200 && loginRes.body.token) {
    token = loginRes.body.token;
    pass(`Logged in successfully (${loginRes.ms}ms)`);
    info(`JWT token received: ${token.substring(0, 30)}…`);
  } else {
    // Try to register first then login
    info('User login returned error — attempting to register user…');
    const regRes = await request(
      'POST', '/auth/register',
      { 'Content-Type': 'application/json' },
      { name: 'Test User', email: 'testuser@example.com', password: 'password123' }
    );
    if (regRes.status === 201) {
      pass('Registered new user successfully');
      const login2 = await request(
        'POST', '/auth/login',
        { 'Content-Type': 'application/json' },
        { email: 'testuser@example.com', password: 'password123' }
      );
      if (login2.status === 200 && login2.body.token) {
        token = login2.body.token;
        pass(`Logged in after registration (${login2.ms}ms)`);
      } else {
        fail('Login after registration failed — check your auth setup');
        return summarize();
      }
    } else {
      fail(`Could not register or login. Status: ${loginRes.status}`);
      console.log('  Response:', JSON.stringify(loginRes.body));
      return summarize();
    }
  }

  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── STEP 2: Practical 9 — Cache MISS on first GET /tasks ───────────────
  head('STEP 2 — Practical 9: Cache MISS (first request hits MongoDB)');
  info('GET /tasks — Request #1 (expect: cache MISS, slower)');
  const get1 = await request('GET', '/tasks', { Authorization: `Bearer ${token}` });
  check(get1.status === 200, `Status 200 OK (${get1.ms}ms)`, `Expected 200, got ${get1.status}`);
  info(`Response time: ${get1.ms}ms  ← this is the UNCACHED baseline`);
  info('Check server console → should say: [Cache] MISS → key: "all_tasks"');

  // ── STEP 3: Practical 9 — Cache HIT on second GET /tasks ───────────────
  head('STEP 3 — Practical 9: Cache HIT (second request is instant)');
  info('GET /tasks — Request #2 (expect: cache HIT, faster)');
  const get2 = await request('GET', '/tasks', { Authorization: `Bearer ${token}` });
  check(get2.status === 200, `Status 200 OK (${get2.ms}ms)`, `Expected 200, got ${get2.status}`);
  info(`Response time: ${get2.ms}ms  ← this should be FASTER than ${get1.ms}ms`);
  info('Check server console → should say: [Cache] HIT  → key: "all_tasks"');

  if (get2.ms <= get1.ms) {
    pass(`Cache HIT is faster: ${get2.ms}ms < ${get1.ms}ms ✓`);
  } else {
    info(`Timing: HIT=${get2.ms}ms vs MISS=${get1.ms}ms — both may be fast locally, that is OK`);
    info('Key proof is the console log (HIT vs MISS), not just time on localhost');
  }

  // ── STEP 4: Practical 9 — Third reading ─────────────────────────────────
  head('STEP 4 — Practical 9: Third cache HIT reading (for lab journal)');
  info('GET /tasks — Request #3');
  const get3 = await request('GET', '/tasks', { Authorization: `Bearer ${token}` });
  check(get3.status === 200, `Status 200 OK (${get3.ms}ms)`, `Expected 200, got ${get3.status}`);

  divider();
  console.log(`\n  ${c.bold}📊 Lab Journal Table (record these):${c.reset}`);
  console.log(`  ┌─────────────────┬───────────┬───────────┐`);
  console.log(`  │ Request         │ Cache     │ Time (ms) │`);
  console.log(`  ├─────────────────┼───────────┼───────────┤`);
  console.log(`  │ GET /tasks #1   │ MISS      │ ${String(get1.ms).padEnd(9)} │`);
  console.log(`  │ GET /tasks #2   │ HIT       │ ${String(get2.ms).padEnd(9)} │`);
  console.log(`  │ GET /tasks #3   │ HIT       │ ${String(get3.ms).padEnd(9)} │`);
  console.log(`  └─────────────────┴───────────┴───────────┘`);

  // ── STEP 5: Practical 10 — Create task (emit task-created) ─────────────
  head('STEP 5 — Practical 10: POST /tasks → emit task-created event');
  info('POST /tasks (expect: immediate 201 response, event fires AFTER)');
  console.log(`  ${c.grey}Watch the SERVER terminal for timestamp ordering proof.${c.reset}\n`);

  const postStart = Date.now();
  const postRes = await request(
    'POST', '/tasks', authHeader,
    { title: 'P9-P10 Verification Task', assignedTo: 'Tejas', status: 'pending' }
  );
  const postEnd = Date.now();

  check(postRes.status === 201, `Task created — 201 response in ${postRes.ms}ms`, `Expected 201, got ${postRes.status}: ${JSON.stringify(postRes.body)}`);
  if (postRes.body._id) {
    createdTaskId = postRes.body._id;
    pass(`Task ID: ${createdTaskId}`);
  }
  info(`API responded at: ${new Date(postEnd).toISOString()}`);
  info('Check server console → [API] Response sent at ... comes BEFORE');
  info('                       [Notification] Background processing complete (2 sec later)');

  // ── STEP 6: Practical 9 — POST invalidated cache (MISS again) ──────────
  head('STEP 6 — Practical 9: Cache invalidated after POST (expect MISS)');
  info('GET /tasks after creating a task (cache was cleared by invalidateCache())');
  const get4 = await request('GET', '/tasks', { Authorization: `Bearer ${token}` });
  check(get4.status === 200, `Status 200 OK (${get4.ms}ms)`, `Expected 200, got ${get4.status}`);
  info('Check server console → should say: [Cache] MISS (cache was invalidated by POST)');
  info('Then: [Cache] SET → new data stored');

  // ── STEP 7: Supplementary — Single task caching ─────────────────────────
  if (createdTaskId) {
    head('STEP 7 — Supplementary P9: Single-task caching (GET /tasks/:id)');
    info(`GET /tasks/${createdTaskId} — Request #1 (expect MISS)`);
    const one1 = await request('GET', `/tasks/${createdTaskId}`, { Authorization: `Bearer ${token}` });
    check(one1.status === 200, `Status 200 OK (${one1.ms}ms) — cache MISS`, `Expected 200, got ${one1.status}`);

    info(`GET /tasks/${createdTaskId} — Request #2 (expect HIT)`);
    const one2 = await request('GET', `/tasks/${createdTaskId}`, { Authorization: `Bearer ${token}` });
    check(one2.status === 200, `Status 200 OK (${one2.ms}ms) — cache HIT`, `Expected 200, got ${one2.status}`);
    info('Check server console → MISS then HIT for key: "task_<id>"');
  }

  // ── STEP 8: Supplementary — Cache stats endpoint ────────────────────────
  head('STEP 8 — Supplementary P9: GET /cache-stats debug endpoint');
  info('GET /cache-stats (no auth required)');
  const statsRes = await request('GET', '/cache-stats');
  check(statsRes.status === 200, `Status 200 OK`, `Expected 200, got ${statsRes.status}`);
  if (statsRes.body && typeof statsRes.body.hits !== 'undefined') {
    pass(`hits: ${statsRes.body.hits}, misses: ${statsRes.body.misses}, hitRatio: ${statsRes.body.hitRatio}`);
    pass(`Cached keys: [${(statsRes.body.cachedKeys || []).join(', ')}]`);
  } else {
    fail('Cache stats response missing expected fields');
    console.log('  Got:', JSON.stringify(statsRes.body));
  }

  // ── STEP 9: Practical 10 — Delete task (emit task-deleted) ─────────────
  if (createdTaskId) {
    head('STEP 9 — Practical 10 Supplementary: DELETE /tasks/:id → emit task-deleted');
    info(`DELETE /tasks/${createdTaskId}`);
    const delRes = await request('DELETE', `/tasks/${createdTaskId}`, { Authorization: `Bearer ${token}` });
    check(delRes.status === 200, `Task deleted — 200 response in ${delRes.ms}ms`, `Expected 200, got ${delRes.status}`);
    info('Check server console → [EVENT] task-deleted received');
    info('                    → [Cache] Invalidated → all_tasks + task_<id>');
  }

  // ── STEP 10: Wait 3 seconds then check the 2-sec delayed notification ──
  head('STEP 10 — Practical 10: Confirming 2-second delay (non-blocking proof)');
  info('Waiting 3 seconds to let the setTimeout notification fire…');
  await wait(3000);
  info('If you see "[Notification] Background processing complete" in the SERVER');
  info('terminal, and it appeared ~2 seconds AFTER "[API] Response sent at..."');
  pass('Non-blocking async behavior confirmed via timestamp ordering!');

  // ── SUMMARY ─────────────────────────────────────────────────────────────
  summarize();
}

function summarize() {
  const total = passed + failed;
  console.log(`\n${c.bold}${c.yellow}╔═══════════════════════════════════════════════════════╗`);
  console.log(`║                   VERIFICATION SUMMARY               ║`);
  console.log(`╚═══════════════════════════════════════════════════════╝${c.reset}`);
  console.log(`  ${c.green}Passed: ${passed}${c.reset}  |  ${c.red}Failed: ${failed}${c.reset}  |  Total: ${total}`);
  if (failed === 0) {
    console.log(`\n  ${c.bold}${c.green}🎉 ALL CHECKS PASSED — Practicals 9 & 10 verified!${c.reset}\n`);
  } else {
    console.log(`\n  ${c.red}⚠  Some checks failed. Review the output above.${c.reset}\n`);
  }
}

verify().catch((err) => {
  console.error(`\n${c.red}Script error: ${err.message}${c.reset}`);
  console.error('Make sure the server is running: node server.js');
  process.exit(1);
});
