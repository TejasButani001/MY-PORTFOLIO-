# Full-Stack Task Management System — Containerized with Docker & Docker Compose

**Charotar University of Science and Technology (CHAROTAR)**  
**Faculty of Technology and Engineering | Department of Information Technology / CE / CSE / AIML**  
**Course:** Advanced Web Development Frameworks (`ITUE301`)  
**Practical 11:** Containerization with Docker and Docker Compose (`CO5 / PO3, PO5`)

---

## 📌 Practical 11 Overview & Objectives

The goal of Practical 11 is to take the full-stack Task Management application (developed in Practicals 1–10) and containerize all three tiers into isolated, reproducible Docker containers, and orchestrate them seamlessly using **Docker Compose** with a single command:

```bash
docker-compose up --build
```

### 3-Tier Container Architecture

```
                    HOST MACHINE (Your Computer / Browser)
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼ (Port 5173)                                       ▼ (Port 5000)
    http://localhost:5173                               http://localhost:5000
            │                                                   │
┌───────────┼───────────────────────────────────────────────────┼───────────┐
│           │               DOCKER ENGINE                       │           │
│           ▼                                                   ▼           │
│   ┌───────────────┐           HTTP (REST API)         ┌───────────────┐   │
│   │   frontend    │ ────────────────────────────────► │    backend    │   │
│   │ (React Vite)  │                                   │(Node/Express) │   │
│   │  Port: 5173   │                                   │  Port: 5000   │   │
│   └───────────────┘                                   └───────┬───────┘   │
│                                                               │           │
│                                        mongodb://mongodb:27017│ (Internal)│
│                                                               ▼           │
│                                                       ┌───────────────┐   │
│               DOCKER BRIDGE NETWORK                   │    mongodb    │   │
│                  (app-network)                        │ (Mongo Image) │   │
│                                                       │  Port: 27017  │   │
│                                                       └───────┬───────┘   │
│                                                               │           │
│                                                  Mounted to:  ▼           │
│                                                      [mongo-data]         │
│                                                     (Named Volume)        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
student-portfolio/
│
├── docker-compose.yml          # Top-level multi-container orchestrator
├── verify-p11.js               # Automated readiness verification script
│
├── backend/                    # Node.js + Express REST API
│   ├── Dockerfile              # Container definition for Express backend
│   ├── .dockerignore           # Excludes node_modules and .env from context
│   ├── server.js               # Express entry point (uses mongodb://mongodb:27017/taskdb)
│   ├── .env.example            # Environment configuration template
│   └── package.json            # Backend dependencies
│
├── frontend/                   # React (Vite) Application
│   ├── Dockerfile              # Container definition (Vite preview on 5173)
│   ├── Dockerfile.multistage   # Multi-stage production build (Nginx ~25MB)
│   ├── nginx.conf              # SPA routing server configuration for Nginx
│   ├── .dockerignore           # Excludes node_modules and dist from context
│   ├── vite.config.js          # Configured with host: 0.0.0.0 and port: 5173
│   └── package.json            # Frontend dependencies
│
├── P11_LAB_REPORT.md           # Complete academic lab report for submission
├── P11_WORD_DOCUMENT_GUIDE.md  # Viva preparation & screenshot guide
└── README.md                   # This project manual
```

---

## 🚀 Quick Start Guide (Single Command Execution)

### Step 1: Verify Docker Desktop is Running
Make sure Docker Desktop (or Docker Engine) is installed and running:

```bash
docker --version
docker compose version
```

### Step 2: Validate Project Setup
Run the automated verification script:

```bash
node verify-p11.js
```
*(All 31 checks will pass with 100% confirmation).*

### Step 3: Launch the Entire Stack
Build images and start all 3 containers with a single command:

```bash
docker-compose up --build
```

To run in detached (background) mode:
```bash
docker-compose up --build -d
```

### Step 4: Verify Container Health
Check that all 3 containers are healthy and running:

```bash
docker ps
```

You should see:
| CONTAINER ID | IMAGE | COMMAND | STATUS | PORTS | NAMES |
|---|---|---|---|---|---|
| `...` | `student-portfolio-frontend` | `npm run preview -- --host` | Up | `0.0.0.0:5173->5173/tcp` | `frontend` |
| `...` | `student-portfolio-backend` | `node server.js` | Up | `0.0.0.0:5000->5000/tcp` | `backend` |
| `...` | `mongo:latest` | `docker-entrypoint.sh mongod` | Up | `0.0.0.0:27017->27017/tcp` | `mongodb` |

### Step 5: Access the Application
- **React Frontend:** Open `http://localhost:5173`
- **Task Manager UI:** Open `http://localhost:5173/tasks`
- **Backend API:** Open `http://localhost:5000/tasks`
- **Backend Health Check:** Open `http://localhost:5000/events/log`

### Step 6: Shutting Down the Stack
To gracefully stop all containers:
```bash
docker-compose down
```
To stop and also remove the persistent MongoDB volume:
```bash
docker-compose down -v
```

---

## 🧠 Key Questions & In-Depth Technical Analysis

### Q1: Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?
- **Answer:** In Docker, each container operates inside its own isolated **network namespace** with its own distinct loopback interface (`localhost` / `127.0.0.1`). If the backend container attempts to connect to `localhost:27017`, it is looking for MongoDB *inside its own container*, where MongoDB is not installed or running.
- In `docker-compose.yml`, all services share a user-defined bridge network (`app-network`). Docker runs an internal embedded DNS server at `127.0.0.11` that automatically resolves compose service names (e.g., `mongodb`, `backend`, `frontend`) to their private container IP addresses (e.g., `172.20.0.2`). Therefore, the backend must connect to `mongodb://mongodb:27017/taskdb`.

### Q2: What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
- **Answer:**
  1. `EXPOSE` (Dockerfile): Purely **documentation and metadata**. It tells developers and Docker tools which port the application inside the container intends to listen on. It does **not** publish or make the port accessible to the outside host machine.
  2. `ports` (docker-compose.yml): Actually publishes the port to the host machine in `<HOST_PORT>:<CONTAINER_PORT>` format (e.g., `"5000:5000"`). It creates iptables / NAT forwarding rules so external browser requests on `http://localhost:5000` are routed into container port `5000`.

### Q3: Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
- **Answer:**
  1. **OS / Architecture Mismatch:** Native binary packages (e.g., `bcrypt`, `sharp`, `esbuild`) compiled on Windows or macOS will fail to run inside a Linux container (e.g., `Linux x86_64 / Alpine`).
  2. **Bloated Build Context:** `node_modules` contains thousands of files, slowing down `docker build` context transfer dramatically (takes several gigabytes and several minutes).
  3. **Inconsistent Dependencies:** Running `npm install` (or `npm ci`) inside the container ensures dependencies strictly conform to `package-lock.json` and are built for the target container environment.

---

## 🛠️ Supplementary Problems & Solutions

### 1. `.dockerignore` Implementation
Created `.dockerignore` in both `frontend/` and `backend/` folders to exclude:
- `node_modules` (prevents host dependencies from polluting container builds)
- `.env` (prevents leaking production credentials or local environment variables)
- `.git` and build caches (`dist/`, `.vscode`)

### 2. Multi-Stage Build for React Frontend
A multi-stage build (`frontend/Dockerfile.multistage`) was implemented using:
- **Stage 1 (Builder):** Uses `node:18-alpine` to install dependencies and run `npm run build`.
- **Stage 2 (Runner):** Uses `nginx:alpine` and copies **only the compiled static assets** (`/app/dist`) into `/usr/share/nginx/html`.
- **Result:** Image size reduced from **~1.1 GB (Node SDK)** down to **~25 MB (Nginx)** — an **impressive 97.7% reduction**!

### 3. Named Volume for MongoDB Data Persistence
Configured a named Docker volume in `docker-compose.yml`:
```yaml
volumes:
  mongo-data:
    driver: local
```
Mounted to the container:
```yaml
services:
  mongodb:
    volumes:
      - mongo-data:/data/db
```
**Benefit:** When containers are restarted or destroyed (`docker-compose down`), all created tasks, users, and collections remain safely preserved inside the `mongo-data` volume.

---

## 🔍 Troubleshooting Guide

| Issue / Symptom | Root Cause | Exact Solution |
|---|---|---|
| **Backend cannot connect to MongoDB** | Connection string uses `localhost` instead of Compose service name | In `server.js` and `docker-compose.yml`, set `MONGO_URI=mongodb://mongodb:27017/taskdb` |
| **Port already in use error (`5000` or `5173` or `27017`)** | A previous local process or older container is bound to that port | Run `docker ps` to find and stop conflicting containers, or run `netstat -ano \| findstr :5000` on Windows |
| **Docker build is extremely slow** | Host `node_modules` are being sent to Docker daemon | Add `.dockerignore` containing `node_modules` in frontend and backend folders |
| **Code modifications not showing in container** | Docker uses old cached image layers | Run `docker-compose up --build` to force image rebuilding |

---

## 🎓 Viva Questions & Quick Answers

1. **What is a Docker container?**  
   *A lightweight, standalone, executable package of software that includes everything needed to run an application (code, runtime, libraries, system tools).*
2. **What is the difference between a Docker image and a container?**  
   *An image is a read-only blueprint/template; a container is a running instance of an image with a writable layer.*
3. **What is Docker Compose?**  
   *A tool for defining and running multi-container Docker applications using a declarative YAML file (`docker-compose.yml`).*
4. **What is the role of `depends_on`?**  
   *It controls the container startup order (e.g., start `mongodb` before `backend`, and start `backend` before `frontend`).*
5. **How do containers communicate on the bridge network?**  
   *Docker Compose creates a private DNS resolver so containers talk using their service names (`http://backend:5000`, `mongodb://mongodb:27017`).*
