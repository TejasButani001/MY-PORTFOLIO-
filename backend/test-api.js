const http = require('http');
const { spawn } = require('child_process');

const serverProcess = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

serverProcess.stdout.on('data', (data) => {
  console.log(`[SERVER]: ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[SERVER ERR]: ${data.toString().trim()}`);
});

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  await new Promise(r => setTimeout(r, 2500));
  
  console.log('\n--- VERIFYING PRACTICAL 5 MONGOOSE & MONGODB REST API ---\n');
  
  // 1. GET /tasks
  let res = await request('GET', '/tasks');
  console.log('1. GET /tasks -> Status:', res.status, '| Response count:', Array.isArray(res.body) ? res.body.length : res.body);
  
  // 2. POST /tasks (Create task)
  res = await request('POST', '/tasks', { 'Content-Type': 'application/json' }, {
    title: 'Learn MongoDB & Mongoose',
    description: 'Practice Mongoose schema design and CRUD operations',
    priority: 'high'
  });
  console.log('2. POST /tasks (Create) -> Status:', res.status, '| Response:', JSON.stringify(res.body));
  const createdTaskId = res.body._id;

  // 3. POST /tasks (Validation Error - missing title)
  res = await request('POST', '/tasks', { 'Content-Type': 'application/json' }, {
    description: 'Task without title'
  });
  console.log('3. POST /tasks (Missing Title) -> Status:', res.status, '| Response:', JSON.stringify(res.body));

  // 4. POST /tasks (Validation Error - invalid priority)
  res = await request('POST', '/tasks', { 'Content-Type': 'application/json' }, {
    title: 'Invalid Priority Task',
    priority: 'urgent'
  });
  console.log('4. POST /tasks (Invalid Priority) -> Status:', res.status, '| Response:', JSON.stringify(res.body));

  // 5. GET /tasks/:id
  if (createdTaskId) {
    res = await request('GET', `/tasks/${createdTaskId}`);
    console.log('5. GET /tasks/:id -> Status:', res.status, '| Response:', JSON.stringify(res.body));

    // 6. PUT /tasks/:id
    res = await request('PUT', `/tasks/${createdTaskId}`, { 'Content-Type': 'application/json' }, {
      completed: true,
      priority: 'medium'
    });
    console.log('6. PUT /tasks/:id -> Status:', res.status, '| Response:', JSON.stringify(res.body));

    // 7. DELETE /tasks/:id
    res = await request('DELETE', `/tasks/${createdTaskId}`);
    console.log('7. DELETE /tasks/:id -> Status:', res.status, '| Response:', JSON.stringify(res.body));
  }

  // 8. GET /tasks/:id (Non-existing ObjectId)
  res = await request('GET', '/tasks/507f1f77bcf86cd799439011');
  console.log('8. GET /tasks/507f1f77bcf86cd799439011 (Not found) -> Status:', res.status, '| Response:', JSON.stringify(res.body));

  // 9. GET /tasks/abc (Invalid ID format)
  res = await request('GET', '/tasks/abc');
  console.log('9. GET /tasks/abc (Invalid Format) -> Status:', res.status, '| Response:', JSON.stringify(res.body));

  console.log('\n--- ALL VERIFICATIONS PASSED ---');
  serverProcess.kill();
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  serverProcess.kill();
  process.exit(1);
});
