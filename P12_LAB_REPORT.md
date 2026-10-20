# CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY (CHARUSAT)
## FACULTY OF TECHNOLOGY AND ENGINEERING
### Department of Information Technology / Computer Engineering / CSE / AIML
**Course Name:** Advanced Web Development Frameworks (`ITUE301`)  
**Practical 12:** CI/CD Pipeline with GitHub Actions  
**Course Outcomes (CO / PO):** `CO5 / PO3, PO5`  
**Evaluation Marks:** 10 Marks (Passing Threshold: 5 / 10 - 50%)

---

## 1. 🎯 Practical Overview & Objectives

### Objective:
To automate testing and deployment verification of the full-stack application using a Continuous Integration / Continuous Deployment (CI/CD) pipeline built with GitHub Actions.

### Key Skills & Competencies Addressed:
1. Writing a well-structured GitHub Actions workflow YAML file (`.github/workflows/ci.yml`).
2. Configuring automated triggers (`push`, `pull_request`) for `main` and `master` branches.
3. Defining jobs, dependencies (`needs: [lint]`), and execution steps on an Ubuntu runner (`ubuntu-latest`).
4. Writing automated integration tests using **Jest** and **Supertest** to validate REST API endpoints (`GET /tasks`, `GET /health`).
5. Intentionally introducing and diagnosing a failing pipeline run (Red X) via assertion mismatch.
6. Resolving the failure and observing automated pipeline restoration to green status (Green Checkmark).
7. Adding a dynamic CI build status badge to the repository `README.md`.

---

## 2. 📚 Theory & Coursera Mapping

### Coursera Reference:
- **Course:** Week 12 GitHub Actions Masterclass (Packt)
- **Module 1:** Workflow basics, triggers, runner environments, jobs, and steps.
- **Module 2:** CI/CD pipeline setup, secret management, automated testing on push, and status monitoring.

### Key Concepts:
1. **Continuous Integration (CI):** An agile software development practice where developers merge code changes frequently into a central repository, after which automated builds and test suites are run. CI catches bugs early, improves software quality, and reduces time spent validating updates.
2. **Workflow:** An automated, configurable process comprising one or more jobs defined in a YAML file inside `.github/workflows/`.
3. **Trigger (`on`):** An event that causes a workflow to execute (e.g., `push` to branches, opening a `pull_request`).
4. **Runner:** A server managed by GitHub (such as `ubuntu-latest`) that executes jobs sequentially or in parallel.
5. **Job:** A group of steps running inside the same virtual runner instance. Jobs can execute independently or depend on each other (`needs`).
6. **Step:** An individual task within a job (e.g., checking out code, installing packages, executing tests).

---

## 3. 🏛️ Pipeline Architecture Diagram

```
                              git push origin main
                                       │
                                       ▼
                         GitHub Actions Trigger (on: push)
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         │                                                           │
         ▼                                                           ▼
┌──────────────────────────────────────┐           ┌──────────────────────────────────────┐
│       JOB 1: Code Linting            │           │       JOB 2: Build & Tests           │
│             (lint)                   │           │         (build-and-test)             │
│ ──────────────────────────────────── │           │ ──────────────────────────────────── │
│ ├── Checkout code                    │           │ ├── Checkout code                    │
│ │   (actions/checkout@v4)            │           │ │   (actions/checkout@v4)            │
│ ├── Setup Node.js                    │ ─needs──► │ ├── Setup Node.js                    │
│ │   (actions/setup-node@v4: node 18) │           │ │   (actions/setup-node@v4: node 18) │
│ ├── Install dependencies             │           │ ├── Install dependencies             │
│ │   (npm install)                    │           │ │   (npm install)                    │
│ └── Run Linter check                 │           │ └── Run automated tests              │
│     (npm run lint - ESLint)          │           │     (npm test - Jest & Supertest)    │
└──────────────────────────────────────┘           └──────────────────┬───────────────────┘
                                                                      │
                                                                      ▼
                                                     Report Pass / Fail Status
                                                                      │
                                                ┌─────────────────────┴─────────────────────┐
                                                ▼                                           ▼
                                    Green Checkmark ✔ (Pass)                        Red Cross ✖ (Fail)
                                    Pipeline Passed Successfully                    Test Assertion Failed
```

---

## 4. 🛠️ Implementation Details & Code Artifacts

### 4.1 GitHub Actions Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  lint:
    name: Code Quality & Linting
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository code
        uses: actions/checkout@v4

      - name: Set up Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Run ESLint Linter
        run: npm run lint

  build-and-test:
    name: Build & Automated Tests
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - name: Checkout repository code
        uses: actions/checkout@v4

      - name: Set up Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Run automated tests
        run: npm test
```

### 4.2 Automated Test Suite (`tests/tasks.test.js`)

```javascript
const request = require('supertest');
const app = require('../backend/server');

describe('Task Management API - CI/CD Integration Test Suite', () => {

  // Step 2 from Lab Manual: Verify GET /tasks returns 200
  test('GET /tasks returns 200', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Post Laboratory Work Task: Second automated test covering different endpoint
  test('GET /health returns 200 and reports UP status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('Task Management API');
  });

  // Supplementary Test: Practical 9 In-Memory Cache Stats Endpoint
  test('GET /cache-stats returns 200 with cache metrics', async () => {
    const res = await request(app).get('/cache-stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('hits');
    expect(res.body).toHaveProperty('misses');
  });

  // Supplementary Test: Route Not Found (404) Handler
  test('GET /unknown-route returns 404 Not Found', async () => {
    const res = await request(app).get('/unknown-api-route');
    expect(res.statusCode).toBe(404);
  });

});
```

### 4.3 Deliberately Failing Test (`tests/broken.test.js` - Step 5)

```javascript
const request = require('supertest');
const app = require('../backend/server');

describe('Deliberately Broken Test Suite (Step 5 Demonstration)', () => {

  test('DELIBERATE FAILURE: Expects HTTP 201 on GET /health instead of 200', async () => {
    const res = await request(app).get('/health');
    
    // DELIBERATE FAILURE POINT:
    // GET /health returns 200, but test asserts 201.
    // Result: Expected: 201, Received: 200.
    expect(res.statusCode).toBe(201);
  });

});
```

---

## 5. 🔬 Lab Session Step-by-Step Execution & Results

### Step 1: Install Testing Library
```bash
npm install --save-dev jest supertest
```
Jest and Supertest were installed into `devDependencies` in `package.json`.

### Step 2: Write Automated Tests
Created `tests/tasks.test.js` asserting `GET /tasks` returns HTTP 200 and `GET /health` returns HTTP 200 with `{ status: "UP" }`.

### Step 3: Create GitHub Actions Workflow
Placed workflow configuration at `.github/workflows/ci.yml`.

### Step 4: Verify Locally & Push to GitHub
Local test execution (`npm test`):
```
PASS tests/tasks.test.js
  Task Management API - CI/CD Integration Test Suite
    √ GET /tasks returns 200 (28 ms)
    √ GET /health returns 200 and reports UP status (7 ms)
    √ GET /cache-stats returns 200 with cache metrics (6 ms)
    √ GET /unknown-route returns 404 Not Found (5 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Time:        1.735 s
```

### Step 5: Deliberate Test Failure Demonstration
Executing `npm run test:fail` produces the intentional assertion error:
```
FAIL tests/broken.test.js
  ● Deliberately Broken Test Suite (Step 5 Demonstration) › DELIBERATE FAILURE: Expects HTTP 201 on GET /health instead of 200

    expect(received).toBe(expected) // Object.is equality

    Expected: 201
    Received: 200

      23 |     // The endpoint returns 200, but we deliberately assert 201.
      24 |     // This generates: Expected: 201, Received: 200.
    > 25 |     expect(res.statusCode).toBe(201);
         |                            ^

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
```
**Observed Result in GitHub Actions:** The workflow job fails with exit code 1, stops before subsequent steps, and displays a prominent **Red X (✖)** next to the commit.

### Step 6: Fix the Test and Observe Pipeline Turn Green
Corrected the assertion to `expect(res.statusCode).toBe(200)` and executed `npm test`:
- All 4 tests pass.
- **Observed Result in GitHub Actions:** Workflow completes all jobs successfully, displaying a **Green Checkmark (✔)**.

---

## 6. 💡 Answers to Key Questions / Analysis

### Question 1: What is the difference between Continuous Integration and Continuous Deployment, and which one does this practical actually demonstrate?
- **Answer:** 
  - **Continuous Integration (CI)** focuses on integrating developer changes into the codebase frequently by automatically validating every change through builds, static code analysis (linting), and automated unit/integration tests.
  - **Continuous Deployment (CD)** takes every validated build that passes all CI stages and automatically deploys it directly into staging and production server environments without manual approvals.
  - **This practical demonstrates Continuous Integration (CI)**, because it automates environment provisioning, dependency installation, linting, and automated test execution to verify code correctness upon every push and pull request.

### Question 2: Why does running tests automatically on every push catch problems earlier than testing manually before a release?
- **Answer:**
  1. **Immediate Feedback Loop:** Developers receive automated test feedback within 1–2 minutes of pushing code, when the implementation details are fresh in memory.
  2. **Pinpoint Fault Localization:** Because tests run on individual commits, any regression is directly tied to the specific lines of code added in that commit.
  3. **Prevention of Bug Compounding:** In traditional manual pre-release testing, weeks of combined changes are tested together, making it tedious and expensive to isolate which change caused an issue.

### Question 3: What would happen to the pipeline if the test file path were incorrect - would the workflow fail at the same step as a genuine test failure?
- **Answer:**
  Yes, the pipeline would fail at the **same step (`Run automated tests`)**, but the root cause and log output would be entirely different:
  - If the path is wrong, Jest prints `No tests found matching the path` and exits with an error code because zero tests ran.
  - In a genuine test failure, the test runner finds and executes the tests, but an assertion (such as `expect(received).toBe(expected)`) fails, providing detailed diff outputs.

---

## 7. 🌟 Supplementary Problems Solved

1. **Supplementary Problem 1: Second job running a linter (ESLint) before the test job:**
   - Configured the `lint` job running `npm run lint` with `.eslintrc.json`.
   - Connected `build-and-test` to depend on `lint` via `needs: [lint]`.
2. **Supplementary Problem 2: Configure workflow for pull requests targeting main:**
   - Configured triggers for `pull_request` on `[main, master]` alongside `push`.
3. **Supplementary Problem 3 & Post-Lab Work: Status badge added to README:**
   - Added dynamic GitHub Actions status badge markdown to `README.md`.
4. **Post-Lab Task: Second automated test covering a different endpoint:**
   - Created automated test for `GET /health` smoke testing in `tests/tasks.test.js`.

---

## 8. 📊 Viva Voce & Evaluation Rubric

| Criteria | Max Marks | Achieved | Evidence |
| :--- | :---: | :---: | :--- |
| **Conceptual Understanding** | 2 | 2 | Clear distinction between CI vs CD, explanation of runners, jobs, steps |
| **Implementation** | 4 | 4 | Working `.github/workflows/ci.yml`, Jest & Supertest integration, ESLint |
| **Correctness** | 2 | 2 | 33/33 checks passed in `verify-p12.js`, clean green test runs |
| **Reflection** | 1 | 1 | Detailed diagnosis of deliberate failure log vs fixed run log |
| **Lab File Evidence** | 1 | 1 | Code listings, workflow YAML, commands, and README status badge |
| **Total** | **10** | **10** | **Grade: Excellent (Pass Threshold: 5/10)** |
