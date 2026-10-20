/**
 * =========================================================================
 * CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY (CHARUSAT)
 * Faculty of Technology and Engineering (CSPIT / DEPSTAR)
 * Course: Advanced Web Development Frameworks (ITUE301)
 * Practical 12: CI/CD Pipeline with GitHub Actions
 * Automated Configuration & Pipeline Verification Script
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('='.repeat(78));
console.log('  CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY - ITUE301');
console.log('  PRACTICAL 12: CI/CD PIPELINE WITH GITHUB ACTIONS VERIFICATION');
console.log('='.repeat(78) + '\n');

let passedChecks = 0;
let totalChecks = 0;

function check(title, condition, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [\x1b[32mPASS\x1b[0m] ${title}`);
    if (details) console.log(`         \x1b[90m${details}\x1b[0m`);
  } else {
    console.log(`  [\x1b[31mFAIL\x1b[0m] ${title}`);
    if (details) console.log(`         \x1b[33mFix: ${details}\x1b[0m`);
  }
}

const rootDir = __dirname;
const githubWorkflowPath = path.join(rootDir, '.github', 'workflows', 'ci.yml');
const packageJsonPath = path.join(rootDir, 'package.json');
const eslintrcPath = path.join(rootDir, '.eslintrc.json');
const testFilePath = path.join(rootDir, 'tests', 'tasks.test.js');
const brokenTestFilePath = path.join(rootDir, 'tests', 'broken.test.js');
const serverPath = path.join(rootDir, 'backend', 'server.js');
const readmePath = path.join(rootDir, 'README.md');

// 1. GitHub Actions Workflow Configuration Checks
console.log('\x1b[36m1. GitHub Actions Workflow Configuration (.github/workflows/ci.yml)\x1b[0m');
const workflowExists = fs.existsSync(githubWorkflowPath);
check('Workflow file exists at exact path (.github/workflows/ci.yml)', workflowExists, githubWorkflowPath);

if (workflowExists) {
  const content = fs.readFileSync(githubWorkflowPath, 'utf8');
  check('Workflow is named "CI Pipeline"', content.includes('name: CI Pipeline'));
  check('Configured triggers on push (on: push)', /on:\s+[\s\S]*?push:/i.test(content));
  check('Listens to main/master branches', content.includes('branches: [main, master]') || content.includes('branches: [main]'));
  check('Defines pull_request trigger for main/master (Supplementary Problem 2)', /pull_request:/i.test(content));
  check('Configures Linter job (lint) before test job (Supplementary Problem 1)', content.includes('lint:'));
  check('Configures Build and Test job (build-and-test)', content.includes('build-and-test:'));
  check('Build-and-test job requires lint job (needs: [lint])', content.includes('needs: [lint]'));
  check('Uses official checkout action (actions/checkout@v4)', content.includes('actions/checkout@v4'));
  check('Uses official Node setup action (actions/setup-node@v4)', content.includes('actions/setup-node@v4'));
  check('Configures Node.js version 18 (with: node-version: 18)', content.includes('node-version: 18'));
  check('Executes dependency installation step (npm install)', content.includes('run: npm install'));
  check('Executes automated test step (npm test)', content.includes('run: npm test'));
}

// 2. Package & Scripts Configuration Checks
console.log('\n\x1b[36m2. Node.js & Package Scripts Configuration (package.json)\x1b[0m');
const pkgExists = fs.existsSync(packageJsonPath);
check('Root package.json exists', pkgExists);

if (pkgExists) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  check('"scripts.test" is configured (Troubleshooting Guide Page 3)', !!(pkg.scripts && pkg.scripts.test && pkg.scripts.test.includes('jest')));
  check('"scripts.lint" is configured (Supplementary Problem 1)', !!(pkg.scripts && pkg.scripts.lint));
  check('"scripts.test:fail" is configured (Step 5 Failure Demo)', !!(pkg.scripts && pkg.scripts['test:fail']));
  check('Jest testing framework declared in dependencies/devDependencies', !!(pkg.devDependencies?.jest || pkg.dependencies?.jest));
  check('Supertest HTTP testing library declared in dependencies/devDependencies', !!(pkg.devDependencies?.supertest || pkg.dependencies?.supertest));
}

// 3. Automated Test Suite Checks
console.log('\n\x1b[36m3. Automated Test Suite (tests/tasks.test.js & tests/broken.test.js)\x1b[0m');
check('Test suite file exists at tests/tasks.test.js', fs.existsSync(testFilePath));

if (fs.existsSync(testFilePath)) {
  const testContent = fs.readFileSync(testFilePath, 'utf8');
  check('Step 2: Automated test asserts GET /tasks returns 200', testContent.includes("GET /tasks returns 200") && testContent.includes('expect(res.statusCode).toBe(200)'));
  check('Post-Lab Task: Second automated test covers different endpoint (GET /health)', testContent.includes("GET /health returns 200"));
  check('Supplementary endpoint test verifies cache stats (GET /cache-stats)', testContent.includes("GET /cache-stats returns 200"));
}

check('Deliberately broken test exists at tests/broken.test.js (Step 5)', fs.existsSync(brokenTestFilePath));
if (fs.existsSync(brokenTestFilePath)) {
  const brokenContent = fs.readFileSync(brokenTestFilePath, 'utf8');
  check('Broken test contains intentional assertion failure (expect 201 instead of 200)', brokenContent.includes('expect(res.statusCode).toBe(201)'));
}

// 4. Backend Server Architecture for CI/CD
console.log('\n\x1b[36m4. Backend Express App CI/CD Integration\x1b[0m');
check('Backend entry file exists at backend/server.js', fs.existsSync(serverPath));
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  check('Exports Express app instance (module.exports = app) for Supertest', serverContent.includes('module.exports = app'));
  check('Isolates app.listen with require.main === module (prevents port conflicts in CI)', serverContent.includes('require.main === module'));
  check('Implements /health endpoint for smoke testing', serverContent.includes("app.get('/health'"));
}

// 5. Code Quality / ESLint Configuration (Supplementary Problem 1)
console.log('\n\x1b[36m5. Code Quality & Linter Configuration (.eslintrc.json)\x1b[0m');
check('.eslintrc.json exists at root', fs.existsSync(eslintrcPath));

// 6. Project Documentation & CI Status Badge (Supplementary Problem 3)
console.log('\n\x1b[36m6. Documentation & README CI Status Badge (Supplementary Problem 3)\x1b[0m');
check('README.md exists', fs.existsSync(readmePath));
if (fs.existsSync(readmePath)) {
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  check('README contains GitHub Actions CI workflow status badge', readmeContent.includes('actions/workflows/ci.yml/badge.svg') || readmeContent.includes('actions/workflows'));
}

// 7. Live Test Run Verification
console.log('\n\x1b[36m7. Live Test Run Execution (npm test)\x1b[0m');
try {
  const testOutput = execSync('npx jest tests/tasks.test.js --runInBand', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  check('Automated test suite (npm test) executes and passes 100% locally', true);
  console.log('         \x1b[32m✔ All Jest test assertions passed cleanly!\x1b[0m');
} catch (err) {
  check('Automated test suite (npm test) executes and passes 100% locally', false, err.message);
}

// Summary Report
console.log('\n' + '='.repeat(78));
const pct = ((passedChecks / totalChecks) * 100).toFixed(0);
console.log(`  VERIFICATION RESULT: ${passedChecks}/${totalChecks} CHECKS PASSED (${pct}%)`);
if (passedChecks === totalChecks) {
  console.log('  \x1b[32m✔ EXCELLENT: Practical 12 CI/CD Pipeline & Tests are 100% complete and verified!\x1b[0m');
} else {
  console.log(`  \x1b[33m⚠ NOTICE: ${totalChecks - passedChecks} item(s) pending completion.\x1b[0m`);
}
console.log('='.repeat(78) + '\n');
