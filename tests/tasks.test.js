/**
 * =========================================================================
 * CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY (CHARUSAT)
 * Faculty of Technology and Engineering (CSPIT / DEPSTAR)
 * Course: Advanced Web Development Frameworks (ITUE301)
 * Practical 12: CI/CD Pipeline with GitHub Actions
 * =========================================================================
 * Automated Integration Tests executed automatically by GitHub Actions CI.
 */

const request = require('supertest');
const app = require('../backend/server');

describe('Task Management API - CI/CD Integration Test Suite', () => {

  // -----------------------------------------------------------------------
  // Step 2 from Lab Manual: Simple test verifying GET /tasks returns 200
  // -----------------------------------------------------------------------
  test('GET /tasks returns 200', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Post Laboratory Work Task: Second automated test covering a different endpoint
  // -----------------------------------------------------------------------
  test('GET /health returns 200 and reports UP status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('Task Management API');
  });

  // -----------------------------------------------------------------------
  // Supplementary Test: Practical 9 In-Memory Cache Stats Endpoint
  // -----------------------------------------------------------------------
  test('GET /cache-stats returns 200 with cache metrics', async () => {
    const res = await request(app).get('/cache-stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('hits');
    expect(res.body).toHaveProperty('misses');
    expect(res.body).toHaveProperty('cachedKeys');
  });

  // -----------------------------------------------------------------------
  // Supplementary Test: Route Not Found (404) Handler Verification
  // -----------------------------------------------------------------------
  test('GET /unknown-route returns 404 Not Found', async () => {
    const res = await request(app).get('/unknown-api-route');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Route not found');
  });

});
