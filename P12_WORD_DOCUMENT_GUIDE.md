# Practical 12: Word Document & Lab Submission Guide
## CI/CD Pipeline with GitHub Actions
**Charotar University of Science and Technology (CHARUSAT)**  
**Department of IT / CE / CSE / AIML — ITUE301 Advanced Web Development Frameworks**

---

## 📋 What to Include in Your Word Document

Your lab submission Word document should contain these standard sections:

1. **Title Page / Header**:
   - Practical 12: CI/CD Pipeline with GitHub Actions
   - Student Name, Student ID (Roll No), Branch, Semester
   - Date of Performance, Date of Submission

2. **Aim & Objective**:
   - To automate testing and deployment verification of the application using a CI/CD pipeline built with GitHub Actions.

3. **Prerequisites & Tools**:
   - Node.js LTS, GitHub Account & Repository, Git CLI, Jest, Supertest, ESLint, Visual Studio Code.

4. **Architecture / Workflow Diagram**:
   *(Copy the diagram from `P12_LAB_REPORT.md` or draw it in Word/Draw.io)*

5. **Source Code Listings**:
   - `.github/workflows/ci.yml` (Complete YAML workflow file)
   - `tests/tasks.test.js` (Automated integration test file)
   - `tests/broken.test.js` (Deliberate failure demonstration file)
   - `backend/server.js` (Express entry with `/health` and `module.exports = app`)
   - `package.json` (Scripts and dependencies)

6. **Screenshots Required (Checklist)**:
   - [ ] **Screenshot 1:** Verification Script passing 100% (`node verify-p12.js`)
   - [ ] **Screenshot 2:** Local test suite passing (`npm test`)
   - [ ] **Screenshot 3:** Local deliberate test failure output (`npm run test:fail`)
   - [ ] **Screenshot 4:** GitHub Actions Tab showing the **Red X (✖)** failed workflow run
   - [ ] **Screenshot 5:** GitHub Actions log showing the assertion failure (`Expected: 201, Received: 200`)
   - [ ] **Screenshot 6:** GitHub Actions Tab showing the **Green Checkmark (✔)** passed workflow run
   - [ ] **Screenshot 7:** GitHub Repository `README.md` displaying the live CI Status Badge

7. **Answers to Key Questions & Analysis**:
   *(Copy Section 6 from `P12_LAB_REPORT.md`)*

8. **Conclusion & Learning Outcomes**:
   - Successfully configured an automated CI/CD pipeline with GitHub Actions.
   - Diagnosed pipeline failures through detailed runner logs.
   - Mastered writing automated integration tests for REST APIs.

---

## 📸 Step-by-Step Screenshot Capture Guide

### Step 1: Local Verification Screenshot
Open your VS Code terminal in the project root and run:
```bash
node verify-p12.js
```
Take a screenshot showing:
- `33/33 CHECKS PASSED (100%)`
- `All Practical 12 CI/CD Pipeline & Tests are 100% complete and verified!`

### Step 2: Local Test Suite Screenshot
Run:
```bash
npm test
```
Take a screenshot showing all 4 tests passing:
- `√ GET /tasks returns 200`
- `√ GET /health returns 200 and reports UP status`
- `√ GET /cache-stats returns 200 with cache metrics`
- `√ GET /unknown-route returns 404 Not Found`

### Step 3: Deliberate Failure Screenshot (Step 5)
Run:
```bash
npm run test:fail
```
Take a screenshot showing:
- `FAIL tests/broken.test.js`
- `Expected: 201`
- `Received: 200`

### Step 4 & 5: GitHub Actions Red X and Failure Log
1. Push the failing change to your GitHub repository:
   ```bash
   git commit -am "test: deliberate failure for CI demonstration"
   git push origin master
   ```
2. In your browser, navigate to your GitHub repo -> **Actions** tab.
3. Take a screenshot showing the red cross next to the commit.
4. Click into the run -> click **build-and-test** -> expand **Run automated tests**.
5. Take a screenshot of the red error log showing `Expected: 201, Received: 200`.

### Step 6 & 7: GitHub Actions Green Checkmark & README Status Badge
1. Restore the test assertion to 200:
   ```bash
   git commit -am "fix: correct test assertion to 200"
   git push origin master
   ```
2. Navigate to the **Actions** tab and take a screenshot showing the green checkmark.
3. Navigate to the **Code** tab to view your `README.md` and screenshot the green `CI Pipeline | passing` badge.

---

## 🎯 Viva Questions & Short Answers

**Q1: What does `ubuntu-latest` mean in `runs-on: ubuntu-latest`?**  
**A:** It tells GitHub to spin up a fresh, ephemeral virtual machine running the latest long-term support (LTS) release of Ubuntu Linux to execute the workflow steps.

**Q2: What is the purpose of `actions/checkout@v4`?**  
**A:** By default, a fresh runner VM has an empty filesystem. `actions/checkout` clones the repository code onto the runner so subsequent steps can access it.

**Q3: Why is `needs: [lint]` used in the workflow?**  
**A:** `needs: [lint]` defines a dependency between jobs. It ensures the test job will only start if the linter job completes without syntax or style errors, saving runner compute time.

**Q4: What is Supertest and how does it test Express apps?**  
**A:** Supertest is an HTTP testing abstraction library built on SuperAgent. It binds to the exported Express `app` instance without needing to launch a real HTTP server on a physical network port.

**Q5: What happens if `package.json` does not specify a `"test"` script?**  
**A:** Running `npm test` fails with the error `npm ERR! Missing script: "test"`. GitHub Actions detects the non-zero exit code and immediately marks the build as failed.
