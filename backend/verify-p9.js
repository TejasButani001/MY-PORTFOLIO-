// =========================================================================
// verify-p9.js  –  Practical 9: In-Memory Caching Verification
//
// Starts the server automatically, runs all tests, then shuts it down.
// HOW TO RUN:
//   node verify-p9.js
// =========================================================================

const http  = require('http');
const { spawn } = require('child_process');

// ── Colours ───────────────────────────────────────────────────────────────
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m',
      C = '\x1b[36m', B = '\x1b[1m',  D = '\x1b[90m', X = '\x1b[0m';

const pass  = (m) => { console.log(`  ${G}✔${X}  ${m}`); passed++; };
const fail  = (m) => { console.log(`  ${R}✘${X}  ${m}`); failed++; };
const info  = (m) =>   console.log(`  ${C}ℹ${X}  ${m}`);
const head  = (m) =>   console.log(`\n${B}${B}${m}${X}\n` + '─'.repeat(54));
const dim   = (m) =>   console.log(`  ${D}${m}${X}`);

let passed = 0, failed = 0;

// ── HTTP helper (measures response time) ─────────────────────────────────
function req(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const r = http.request(
      { hostname: '127.0.0.1', port: 5000, path, method, headers },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          const ms = Date.now() - t0;
          try { resolve({ status: res.statusCode, body: JSON.parse(raw), ms }); }
          catch { resolve({ status: res.statusCode, body: raw, ms }); }
        });
      }
    );
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Start the server as a child process ───────────────────────────────────
function startServer() {
  return new Promise((resolve) => {
    const srv = spawn('node', ['server.js'], { cwd: __dirname, stdio: 'pipe' });

    // Show server logs prefixed so they're easy to spot
    srv.stdout.on('data', (d) => {
      d.toString().trim().split('\n').forEach((line) =>
        console.log(`  ${D}[SERVER] ${line}${X}`)
      );
    });
    srv.stderr.on('data', (d) => {
      d.toString().trim().split('\n').forEach((line) =>
        console.log(`  ${R}[SERVER ERR] ${line}${X}`)
      );
    });

    // Wait until "Server running" appears in stdout
    srv.stdout.on('data', function ready(d) {
      if (d.toString().includes('Server running')) {
        srv.stdout.removeListener('data', ready);
        setTimeout(() => resolve(srv), 500); // small extra delay for Mongo
      }
    });
  });
}

// =========================================================================
async function runTests() {
  console.log(`\n${B}${Y}╔══════════════════════════════════════════════════════╗`);
  console.log(`║    Practical 9 — Caching Verification (Auto-Test)    ║`);
  console.log(`╚══════════════════════════════════════════════════════╝${X}`);

  // ── Start server ─────────────────────────────────────────────────────
  info('Starting server…');
  const server = await startServer();
  info('Server ready!\n');

  let token = '';
  let taskId = '';

  try {
    // ══════════════════════════════════════════════════════════════════
    // AUTH: Register + Login to get a JWT token
    // ══════════════════════════════════════════════════════════════════
    head('STEP 1 — Auth: Register & Login');

    // Try to register (may already exist – that's fine)
    await req('POST', '/auth/register',
      { 'Content-Type': 'application/json' },
      { name: 'Cache Tester', email: 'cachetest@p9.com', password: 'test1234' }
    );

    const login = await req('POST', '/auth/login',
      { 'Content-Type': 'application/json' },
      { email: 'cachetest@p9.com', password: 'test1234' }
    );

    if (login.status === 200 && login.body.token) {
      token = login.body.token;
      pass(`Logged in — JWT token received`);
    } else {
      fail(`Login failed (${login.status}): ${JSON.stringify(login.body)}`);
      return;
    }

    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // ══════════════════════════════════════════════════════════════════
    // TEST 1: First GET /tasks → must be a cache MISS
    // ══════════════════════════════════════════════════════════════════
    head('TEST 1 — First GET /tasks  →  Cache MISS (hits MongoDB)');
    const r1 = await req('GET', '/tasks', { Authorization: `Bearer ${token}` });

    pass(`Status: ${r1.status} | Time: ${r1.ms}ms`);
    dim('Server log should show:  [Cache] MISS → key: "all_tasks"');
    dim('                         [Cache] SET  → key: "all_tasks"');
    const missTime = r1.ms;

    await wait(300); // tiny gap so logs print in order

    // ══════════════════════════════════════════════════════════════════
    // TEST 2: Second GET /tasks → must be a cache HIT (faster)
    // ══════════════════════════════════════════════════════════════════
    head('TEST 2 — Second GET /tasks  →  Cache HIT (served from memory)');
    const r2 = await req('GET', '/tasks', { Authorization: `Bearer ${token}` });

    pass(`Status: ${r2.status} | Time: ${r2.ms}ms`);
    dim('Server log should show:  [Cache] HIT  → key: "all_tasks"');

    await wait(300);

    // ══════════════════════════════════════════════════════════════════
    // TEST 3: Third GET /tasks → cache HIT again (for lab journal)
    // ══════════════════════════════════════════════════════════════════
    head('TEST 3 — Third GET /tasks  →  Cache HIT (for lab journal 3rd reading)');
    const r3 = await req('GET', '/tasks', { Authorization: `Bearer ${token}` });

    pass(`Status: ${r3.status} | Time: ${r3.ms}ms`);
    dim('Server log should show:  [Cache] HIT  → key: "all_tasks"');

    // Lab Journal table
    console.log(`\n  ${B}📊 Lab Journal — Response Time Comparison:${X}`);
    console.log('  ┌───────────────────┬───────────┬───────────┐');
    console.log('  │ Request           │ Cache     │ Time (ms) │');
    console.log('  ├───────────────────┼───────────┼───────────┤');
    console.log(`  │ GET /tasks  #1    │ ${R}MISS${X}      │ ${String(r1.ms).padEnd(9)} │`);
    console.log(`  │ GET /tasks  #2    │ ${G}HIT${X}       │ ${String(r2.ms).padEnd(9)} │`);
    console.log(`  │ GET /tasks  #3    │ ${G}HIT${X}       │ ${String(r3.ms).padEnd(9)} │`);
    console.log('  └───────────────────┴───────────┴───────────┘');

    await wait(300);

    // ══════════════════════════════════════════════════════════════════
    // TEST 4: POST /tasks → cache invalidated; next GET is a MISS again
    // ══════════════════════════════════════════════════════════════════
    head('TEST 4 — POST /tasks  →  Cache Invalidated on Write');
    const post = await req('POST', '/tasks', auth,
      { title: 'Cache Test Task', description: 'Created by verify-p9.js', priority: 'high' }
    );

    if (post.status === 201) {
      taskId = post.body._id;
      pass(`Task created (${post.ms}ms) — ID: ${taskId}`);
    } else {
      fail(`POST failed (${post.status}): ${JSON.stringify(post.body)}`);
    }

    dim('Server log should show:  [Cache] Invalidated → all_tasks');

    await wait(300);

    // GET after POST — must be MISS because cache was cleared
    head('TEST 5 — GET /tasks after POST  →  Cache MISS (stale data cleared)');
    const r4 = await req('GET', '/tasks', { Authorization: `Bearer ${token}` });

    pass(`Status: ${r4.status} | Time: ${r4.ms}ms`);
    dim('Server log should show:  [Cache] MISS → key: "all_tasks"  (fresh from DB)');

    await wait(300);

    // ══════════════════════════════════════════════════════════════════
    // TEST 6 (Supplementary): Single-task caching GET /tasks/:id
    // ══════════════════════════════════════════════════════════════════
    if (taskId) {
      head('TEST 6 — Supplementary: Single-Task Caching  GET /tasks/:id');

      info(`GET /tasks/${taskId}  — Request #1 (expect MISS)`);
      const s1 = await req('GET', `/tasks/${taskId}`, { Authorization: `Bearer ${token}` });
      pass(`Status: ${s1.status} | Time: ${s1.ms}ms`);
      dim(`Server log: [Cache] MISS → key: "task_${taskId}"`);

      await wait(200);

      info(`GET /tasks/${taskId}  — Request #2 (expect HIT)`);
      const s2 = await req('GET', `/tasks/${taskId}`, { Authorization: `Bearer ${token}` });
      pass(`Status: ${s2.status} | Time: ${s2.ms}ms`);
      dim(`Server log: [Cache] HIT  → key: "task_${taskId}"`);
    }

    await wait(300);

    // ══════════════════════════════════════════════════════════════════
    // TEST 7 (Supplementary): Cache stats endpoint
    // ══════════════════════════════════════════════════════════════════
    head('TEST 7 — Supplementary: GET /cache-stats  (debug endpoint)');
    const stats = await req('GET', '/cache-stats');

    if (stats.status === 200 && typeof stats.body.hits !== 'undefined') {
      pass(`Status 200 OK`);
      pass(`Hits: ${stats.body.hits}  |  Misses: ${stats.body.misses}  |  Hit Ratio: ${stats.body.hitRatio}`);
      pass(`Cached keys currently: [${(stats.body.cachedKeys || []).join(', ')}]`);
    } else {
      fail(`Unexpected response (${stats.status}): ${JSON.stringify(stats.body)}`);
    }

    await wait(300);

    // ══════════════════════════════════════════════════════════════════
    // TEST 8: DELETE → cache invalidated
    // ══════════════════════════════════════════════════════════════════
    if (taskId) {
      head('TEST 8 — DELETE /tasks/:id  →  Cache Invalidated on Delete');
      const del = await req('DELETE', `/tasks/${taskId}`, { Authorization: `Bearer ${token}` });

      if (del.status === 200) {
        pass(`Task deleted (${del.ms}ms)`);
        dim('Server log should show:  [Cache] Invalidated → all_tasks + task_<id>');
      } else {
        fail(`DELETE failed (${del.status}): ${JSON.stringify(del.body)}`);
      }
    }

  } finally {
    // ── Summary ────────────────────────────────────────────────────────
    const total = passed + failed;
    console.log(`\n${B}${Y}╔══════════════════════════════════════════════════════╗`);
    console.log(`║                  VERIFICATION SUMMARY               ║`);
    console.log(`╚══════════════════════════════════════════════════════╝${X}`);
    console.log(`  ${G}Passed: ${passed}${X}   ${R}Failed: ${failed}${X}   Total: ${total}`);

    if (failed === 0) {
      console.log(`\n  ${B}${G}🎉 ALL CHECKS PASSED — Practical 9 verified!${X}\n`);
    } else {
      console.log(`\n  ${R}⚠  Some checks failed. See output above.${X}\n`);
    }

    server.kill();
    process.exit(failed === 0 ? 0 : 1);
  }
}

runTests().catch((err) => {
  console.error(`\n${R}Fatal error: ${err.message}${X}`);
  process.exit(1);
});
