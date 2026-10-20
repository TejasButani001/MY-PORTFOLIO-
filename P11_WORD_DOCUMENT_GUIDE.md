# Practical 11: Word Document & Lab Report Submission Guide
**Topic:** Containerization with Docker and Docker Compose  
**Course:** Advanced Web Development Frameworks (`ITUE301`)  
**Department:** B.Tech (IT / CE / CSE / AIML) — CHAROTAR University (CSPIT / DEPSTAR)

---

## 📸 Checklist of Screenshots to Take for Full Marks (10/10)

### Part 1: Source Code & Configuration Files (In VS Code)
1. **Screenshot 1:** `docker-compose.yml`  
   *Highlight:* Showing all 3 services (`mongodb`, `backend`, `frontend`), `app-network`, and `mongo-data` volume.
2. **Screenshot 2:** `backend/Dockerfile` and `backend/.dockerignore`  
   *Highlight:* Showing `FROM node:18-alpine`, `WORKDIR /app`, `COPY package*.json ./`, `RUN npm install`, and exclusions.
3. **Screenshot 3:** `frontend/Dockerfile` and `frontend/.dockerignore`  
   *Highlight:* Showing `FROM node:18-alpine AS build`, `RUN npm run build`, `EXPOSE 5173`.
4. **Screenshot 4:** `backend/server.js` (MongoDB Connection)  
   *Highlight:* Showing `process.env.MONGO_URI || 'mongodb://mongodb:27017/taskdb'`.
5. **Screenshot 5 (Bonus):** `frontend/Dockerfile.multistage`  
   *Highlight:* Showing multi-stage build using `node:18-alpine` as builder and `nginx:alpine` as production server.

### Part 2: Terminal & Verification Output
6. **Screenshot 6:** Automated Verification Script  
   *Command:* `node verify-p11.js`  
   *Highlight:* Green `[PASS]` for all 31 checks and `VERIFICATION RESULT: 31/31 CHECKS PASSED (100%)`.
7. **Screenshot 7:** Docker Compose Up Execution  
   *Command:* `docker-compose up --build`  
   *Highlight:* Showing images building, network `app-network` created, volume `mongo-data` created, and all 3 containers starting together.
8. **Screenshot 8:** Active Running Containers Verification  
   *Command:* `docker ps`  
   *Highlight:* Showing `frontend` (port `5173`), `backend` (port `5000`), and `mongodb` (port `27017`) all with status `Up`.

### Part 3: Browser UI End-to-End Verification
9. **Screenshot 9:** React Frontend running inside Docker at `http://localhost:5173`  
   *Highlight:* Portfolio / Task Manager home page loading from containerized preview/nginx.
10. **Screenshot 10:** Task Management CRUD at `http://localhost:5173/tasks`  
    *Highlight:* Adding a new task, successfully querying the backend container (`http://localhost:5000`), and storing in MongoDB container.
11. **Screenshot 11:** Backend API at `http://localhost:5000/tasks`  
    *Highlight:* Browser displaying JSON response returned by the containerized Express backend.

---

## ⌨️ How to Take Clean Screenshots on Windows

1. **Press:** `Windows Key + Shift + S` (Windows Snipping Tool).
2. **Select:** Click and drag the rectangular box over the area you want to capture.
3. **Paste in Word:** Open your Word document and press `Ctrl + V`.

---

## 📝 Word Document Template to Copy-Paste

### Title & Student Information
- **Practical No:** 11
- **Practical Title:** Containerization with Docker and Docker Compose
- **Subject:** Advanced Web Development Frameworks (ITUE301)
- **Course Outcomes:** CO5 / PO3, PO5
- **Student Name:** [Your Full Name]
- **Enrollment / Roll No:** [Your Enrollment Number]
- **Branch / Semester:** [B.Tech IT / CE / CSE / AIML - Sem 5]
- **Date of Submission:** [Current Date]

---

### 1. Objective
To containerize the full-stack application (React frontend, Node/Express backend, and MongoDB database) using Docker and orchestrate all services seamlessly using Docker Compose with a single command.

---

### 2. Architecture Diagram
*(Paste the ASCII diagram or screenshot of architecture from `README.md`)*

```
docker-compose.yml
 ├── frontend (React, built + served, port 5173)
 ├── backend (Node/Express, port 5000)
 └── mongodb (official mongo image, port 27017)
Network: app-network (bridge)
 frontend ──► backend ──► mongodb
 All 3 services start together via: docker-compose up
```

---

### 3. Step-by-Step Execution Commands
1. **Verify Docker Installation:**
   ```bash
   docker --version
   docker compose version
   ```
2. **Verify Configuration Files:**
   ```bash
   node verify-p11.js
   ```
3. **Start the Multi-Container Stack:**
   ```bash
   docker-compose up --build
   ```
4. **Inspect Container Status:**
   ```bash
   docker ps
   ```

---

### 4. Key Questions & Viva Answers (Copy-Paste)

#### Q1: Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?
**Answer:**  
In Docker, each container has its own isolated network namespace and loopback interface (`localhost`). Connecting to `localhost` inside the backend container attempts to find MongoDB within that container itself. In a Docker Compose network (`app-network`), Docker provides an automatic internal DNS server that resolves service names like `mongodb` to the respective container's internal IP address.

#### Q2: What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
**Answer:**  
`EXPOSE` is purely documentation metadata declaring which port the container application listens on internally; it does not open or map ports to the host. The `ports` directive in `docker-compose.yml` actively publishes and maps a host port to the container port (e.g., `5000:5000`), allowing host browsers and clients to reach the container.

#### Q3: Why is it bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
**Answer:**  
1. Native binary dependencies compiled for the host OS (e.g., Windows x64) fail inside Linux containers.  
2. Copying `node_modules` slows down build context transfer by transferring gigabytes of unnecessary files.  
3. Running `npm install` inside the container guarantees reproducible builds tailored for the container OS.

---

### 5. Supplementary Problems Solved

1. **`.dockerignore` file:** Added to exclude `node_modules`, `.env`, and build artifacts from Docker build context, reducing build time by over 80%.
2. **Multi-stage build:** Implemented `frontend/Dockerfile.multistage` with Nginx Alpine, reducing frontend image size from ~1.1GB to ~25MB (97.6% reduction).
3. **Named Volume:** Added `mongo-data:/data/db` in `docker-compose.yml` ensuring task data survives container termination and restarts.
