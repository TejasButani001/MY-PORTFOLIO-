# Task Management System — CI/CD Pipeline with GitHub Actions

[![CI Pipeline](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-18%20%7C%2020%20%7C%2022-brightgreen.svg)](https://nodejs.org/)
[![Testing Framework](https://img.shields.io/badge/tested%20with-Jest%20%26%20Supertest-red.svg)](https://jestjs.io/)
[![Linter](https://img.shields.io/badge/code%20style-ESLint-purple.svg)](https://eslint.org/)

**Charotar University of Science and Technology (CHARUSAT)**  
**Faculty of Technology and Engineering | Department of Information Technology / CE / CSE / AIML**  
**Course:** Advanced Web Development Frameworks (`ITUE301`)  
**Practical 12:** CI/CD Pipeline with GitHub Actions (`CO5 / PO3, PO5`)

---

## 📌 Practical 12 Overview & Objectives

Practical 12 demonstrates the fundamentals of **Continuous Integration and Continuous Deployment (CI/CD)** by building an automated pipeline using **GitHub Actions**. Every time code is pushed or a pull request is created targeting the `main` or `master` branch, the pipeline automatically:
1. Spawns an isolated Ubuntu Linux runner virtual machine (`ubuntu-latest`).
2. Checks out the repository source code using `actions/checkout@v4`.
3. Provisions a Node.js 18 runtime using `actions/setup-node@v4`.
4. Installs dependencies (`npm install`).
5. Executes static code linting via **ESLint** (Supplementary Problem 1).
6. Runs automated integration tests via **Jest** and **Supertest** to test API endpoints (`GET /tasks` and `GET /health`).
7. Reports clear **Pass (Green Checkmark)** or **Fail (Red X)** status on GitHub commits, pull requests, and the README badge.

---

## 🏛️ CI/CD Pipeline Architecture

```
                    git push origin main / master
                                 │
                                 ▼
                   GitHub Actions Trigger (on: push, pull_request)
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│     JOB 1: Code Linting         │             │     JOB 2: Build & Tests        │
│          (lint)                 │             │       (build-and-test)          │
│ ─────────────────────────────── │             │ ─────────────────────────────── │
│ ├── Checkout code (@v4)         │ ───needs──► │ ├── Checkout code (@v4)         │
│ ├── Setup Node.js 18 (@v4)      │             │ ├── Setup Node.js 18 (@v4)      │
│ ├── npm install                 │             │ ├── npm install                 │
│ └── npm run lint (ESLint)       │             │ └── npm test (Jest + Supertest) │
└─────────────────────────────────┘             └────────────────┬────────────────┘
                                                                 │
                                                                 ▼
                                                Pass: Green Checkmark ✔
                                                Fail: Red Cross ✖
```

---

## 📁 Repository Structure

```
student-portfolio/
│
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI Workflow Definition
│
├── tests/
│   ├── tasks.test.js            # Automated integration tests (GET /tasks & GET /health)
│   └── broken.test.js           # Deliberately failing test (for Step 5 demonstration)
│
├── backend/                     # Node.js + Express REST API
│   ├── server.js                # Express entry point (exports app for Supertest)
│   ├── router/
│   │   └── taskrouter.jsx       # Task routes (GET /tasks returns 200)
│   ├── middleware/              # Auth, validation, logging middleware
│   ├── models/                  # Mongoose data models
│   ├── Dockerfile               # Container definition
│   └── package.json             # Backend dependencies
│
├── .eslintrc.json               # ESLint configuration for lint job
├── verify-p12.js                # Automated verification script for Practical 12
├── verify-p11.js                # Practical 11 Docker verification script
├── package.json                 # Root dependencies, scripts (test, lint, start)
├── P12_LAB_REPORT.md            # Comprehensive academic lab report for Practical 12
├── P12_WORD_DOCUMENT_GUIDE.md   # Word document & viva guide for submission
└── README.md                    # Project manual with CI badge
```

---

## 🚀 Step-by-Step Lab Execution

### Step 1: Verify Everything Locally
Run the automated verification script:
```bash
node verify-p12.js
```
*(All 33 checks will pass with 100% confirmation).*

Run the automated tests:
```bash
npm test
```
*(All 4 tests covering `GET /tasks`, `GET /health`, and `GET /cache-stats` will pass).*

Run the linter check:
```bash
npm run lint
```

---

### Step 2: Push to GitHub to Trigger the Pipeline
1. Add your GitHub remote (if not already set):
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
   ```
2. Commit and push:
   ```bash
   git add .
   git commit -m "feat(p12): Add GitHub Actions CI pipeline with automated Jest tests and ESLint"
   git push -u origin master
   ```
3. Open your GitHub repository in your browser and click the **Actions** tab.
4. You will see the **CI Pipeline** workflow running:
   - `Code Quality & Linting` job runs and passes.
   - `Build & Automated Tests` job runs and passes.
   - A bright **Green Checkmark (✔)** appears next to the commit.

---

### Step 3: Demonstrate a Deliberately Broken Pipeline (Step 5)
A key requirement of Practical 12 is to demonstrate a failed pipeline caused by an intentional error:
1. In `tests/tasks.test.js`, temporarily change:
   ```javascript
   // Change line:
   expect(res.statusCode).toBe(200);
   // To an incorrect expected value:
   expect(res.statusCode).toBe(201);
   ```
2. Or run the broken test suite locally:
   ```bash
   npm run test:fail
   ```
3. Commit and push the broken change:
   ```bash
   git commit -am "test: deliberate failure to demonstrate red X pipeline status"
   git push origin master
   ```
4. Observe the **Actions** tab:
   - The test job fails with exit code 1.
   - A prominent **Red X (✖)** appears on GitHub.
   - Click the failed run to inspect the error log: `Expected: 201, Received: 200`.

---

### Step 4: Fix the Test to Turn the Pipeline Green (Step 6)
1. Restore the assertion in `tests/tasks.test.js`:
   ```javascript
   expect(res.statusCode).toBe(200);
   ```
2. Commit and push the fix:
   ```bash
   git commit -am "fix: restore expected status 200 to pass CI pipeline"
   git push origin master
   ```
3. The workflow runs again and turns **Green (✔)**!
4. Take screenshots of both the **Red X** and **Green Checkmark** runs for your lab journal!

---

## 🏷️ How to Configure Your Status Badge (Supplementary Problem 3)
In this `README.md`, replace `OWNER` and `REPO` on line 3 with your actual GitHub username and repository name:
```markdown
[![CI Pipeline](https://github.com/<YOUR_USERNAME>/<YOUR_REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<YOUR_USERNAME>/<YOUR_REPO>/actions/workflows/ci.yml)
```
Once pushed, the badge will dynamically display **passing** (green) or **failing** (red) live!

---

## ❓ Key Questions & Analysis (Viva Answers)

### Q1: What is the difference between Continuous Integration (CI) and Continuous Deployment (CD), and which one does this practical demonstrate?
- **Continuous Integration (CI):** The practice of automatically building and testing code on every commit or pull request to identify errors early.
- **Continuous Deployment (CD):** The automated process of deploying validated code to staging or production environments without manual human intervention.
- **This Practical:** Demonstrates **Continuous Integration (CI)** because it automatically checks out code, installs dependencies, runs linters, and executes automated tests on every push.

### Q2: Why does running tests automatically on every push catch problems earlier than testing manually before a release?
Running automated tests on every push isolates bugs to the exact individual commit that introduced them, reducing debugging time from hours to minutes. In contrast, manual testing before a release batches weeks of changes together, making root cause discovery significantly more difficult and expensive.

### Q3: What would happen to the pipeline if the test file path were incorrect? Would the workflow fail at the same step as a genuine test failure?
If the test file path is incorrect (e.g., `jest nonexistent/test.js`), Jest exits with code 1 during the `npm test` step because no matching test files were discovered. While the pipeline fails at the **same step (`Run automated tests`)**, the error log displays `No tests found` rather than an assertion failure (`Expected: X, Received: Y`).

---

## 🧪 Quick Commands Reference

| Command | Action |
| :--- | :--- |
| `npm test` | Runs automated Jest integration tests |
| `npm run test:fail` | Runs deliberately broken test (Step 5 demo) |
| `npm run lint` | Runs ESLint static analysis check |
| `node verify-p12.js` | Runs automated 33-point Practical 12 validation |
| `npm start` | Starts Express backend server on port 5000 |
