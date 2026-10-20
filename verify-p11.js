/**
 * =========================================================================
 * CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY
 * Practical 11: Containerization with Docker and Docker Compose
 * Automated Configuration & Readiness Verification Script
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('='.repeat(75));
console.log('  CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY - ITUE301');
console.log('  PRACTICAL 11: CONTAINERIZATION AUTOMATED VERIFICATION');
console.log('='.repeat(75) + '\n');

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
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// 1. Docker Compose Configuration Checks
console.log('\x1b[36m1. Docker Compose Configuration (Root)\x1b[0m');
const composePath = path.join(rootDir, 'docker-compose.yml');
const composeExists = fs.existsSync(composePath);
check('docker-compose.yml exists at project root', composeExists, composePath);

if (composeExists) {
  const composeContent = fs.readFileSync(composePath, 'utf8');
  check('Defines "frontend" service', composeContent.includes('frontend:'));
  check('Defines "backend" service', composeContent.includes('backend:'));
  check('Defines "mongodb" service', composeContent.includes('mongodb:'));
  check('Configures frontend port mapping 5173:5173', composeContent.includes('5173:5173'));
  check('Configures backend port mapping 5000:5000', composeContent.includes('5000:5000'));
  check('Configures MongoDB port mapping 27017:27017', composeContent.includes('27017:27017'));
  check('Configures custom bridge network (app-network)', composeContent.includes('app-network:'));
  check('Configures persistent named volume for MongoDB (mongo-data)', composeContent.includes('mongo-data:/data/db'));
  check('Configures startup dependency (depends_on: mongodb & backend)', composeContent.includes('depends_on:'));
}

// 2. Backend Docker Configuration Checks
console.log('\n\x1b[36m2. Backend Container Configuration\x1b[0m');
const backendDockerfile = path.join(backendDir, 'Dockerfile');
const backendDockerfileExists = fs.existsSync(backendDockerfile);
check('backend/Dockerfile exists', backendDockerfileExists, backendDockerfile);

if (backendDockerfileExists) {
  const bContent = fs.readFileSync(backendDockerfile, 'utf8');
  check('Uses Node.js LTS base image (18/20/22)', /FROM\s+node:(?:18|20|22)/i.test(bContent));
  check('Sets working directory to /app', /WORKDIR\s+\/app/i.test(bContent));
  check('Copies package.json first for layer caching', /COPY\s+package\*\.json/i.test(bContent));
  check('Runs npm install inside container', /RUN\s+npm\s+install/i.test(bContent));
  check('Exposes port 5000', /EXPOSE\s+5000/i.test(bContent));
  check('Defines CMD ["node", "server.js"]', bContent.includes('server.js'));
}

const backendDockerignore = path.join(backendDir, '.dockerignore');
const backendDockerignoreExists = fs.existsSync(backendDockerignore);
check('backend/.dockerignore exists (Supplementary Problem 1)', backendDockerignoreExists);
if (backendDockerignoreExists) {
  const bIgnore = fs.readFileSync(backendDockerignore, 'utf8');
  check('backend/.dockerignore excludes node_modules', bIgnore.includes('node_modules'));
  check('backend/.dockerignore excludes .env', bIgnore.includes('.env'));
}

// 3. Frontend Docker Configuration Checks
console.log('\n\x1b[36m3. Frontend Container Configuration\x1b[0m');
const frontendDockerfile = path.join(frontendDir, 'Dockerfile');
const frontendDockerfileExists = fs.existsSync(frontendDockerfile);
check('frontend/Dockerfile exists', frontendDockerfileExists, frontendDockerfile);

if (frontendDockerfileExists) {
  const fContent = fs.readFileSync(frontendDockerfile, 'utf8');
  check('Uses Node.js LTS base image (18/20/22)', /FROM\s+node:(?:18|20|22)/i.test(fContent));
  check('Sets working directory to /app', /WORKDIR\s+\/app/i.test(fContent));
  check('Runs npm run build to compile production assets', /RUN\s+npm\s+run\s+build/i.test(fContent));
  check('Exposes port 5173', /EXPOSE\s+5173/i.test(fContent));
  check('Runs preview command with host binding', /preview/i.test(fContent));
}

const frontendDockerignore = path.join(frontendDir, '.dockerignore');
const frontendDockerignoreExists = fs.existsSync(frontendDockerignore);
check('frontend/.dockerignore exists (Supplementary Problem 1)', frontendDockerignoreExists);
if (frontendDockerignoreExists) {
  const fIgnore = fs.readFileSync(frontendDockerignore, 'utf8');
  check('frontend/.dockerignore excludes node_modules', fIgnore.includes('node_modules'));
  check('frontend/.dockerignore excludes dist', fIgnore.includes('dist'));
}

const frontendMultistage = path.join(frontendDir, 'Dockerfile.multistage');
check('frontend/Dockerfile.multistage exists (Supplementary Problem 2)', fs.existsSync(frontendMultistage));

// 4. Inter-Container Networking / Service Name Resolution Checks
console.log('\n\x1b[36m4. Inter-Container Networking & Service DNS (Step 5)\x1b[0m');
const serverJsPath = path.join(backendDir, 'server.js');
if (fs.existsSync(serverJsPath)) {
  const serverContent = fs.readFileSync(serverJsPath, 'utf8');
  check('Backend references MongoDB by Docker service name "mongodb"', serverContent.includes('mongodb://mongodb:27017/taskdb'));
}

// 5. Host Docker Environment Check (Informational)
console.log('\n\x1b[36m5. Host Docker Environment Status\x1b[0m');
try {
  const dockerVersion = execSync('docker --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  console.log(`  [\x1b[32mDETECTED\x1b[0m] ${dockerVersion}`);
} catch (e) {
  console.log('  [\x1b[33mINFO\x1b[0m] Docker CLI not in current local PATH. When running on lab machine or after starting Docker Desktop, verify with:');
  console.log('         \x1b[90mdocker --version && docker compose version\x1b[0m');
}

// Summary Report
console.log('\n' + '='.repeat(75));
console.log(`  VERIFICATION RESULT: ${passedChecks}/${totalChecks} CHECKS PASSED (${((passedChecks / totalChecks) * 100).toFixed(0)}%)`);
if (passedChecks === totalChecks) {
  console.log('  \x1b[32m✔ EXCELLENT: All Practical 11 Docker & Compose configurations are 100% ready!\x1b[0m');
  console.log('\n  Next Step: Start the complete stack with:');
  console.log('  \x1b[36mdocker-compose up --build\x1b[0m\n');
} else {
  console.log('  \x1b[31m✖ Some checks failed. Review the output above.\x1b[0m\n');
}
console.log('='.repeat(75));
