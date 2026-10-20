/**
 * =========================================================================
 * Practical 12 - Step 5: Deliberately Broken Test for CI Demonstration
 * =========================================================================
 * To demonstrate a failed pipeline (Red X on GitHub Actions):
 * 1. The test deliberately expects status 201 (Created), but GET /health returns 200 (OK).
 * 2. You can test this locally by running:
 *      npm run test:fail
 * 3. In GitHub Actions, when this test runs, Jest exits with code 1.
 * 4. GitHub Actions halts the pipeline, marks the run with a RED X, and sends an alert.
 * 5. To fix the pipeline (Step 6), change 201 back to 200 (or keep this file skipped).
 */

const request = require('supertest');
const app = require('../backend/server');

describe('Deliberately Broken Test Suite (Step 5 Demonstration)', () => {

  test('DELIBERATE FAILURE: Expects HTTP 201 on GET /health instead of 200', async () => {
    const res = await request(app).get('/health');
    
    // DELIBERATE FAILURE POINT:
    // The endpoint returns 200, but we deliberately assert 201.
    // This generates: Expected: 201, Received: 200.
    expect(res.statusCode).toBe(201);
  });

});
