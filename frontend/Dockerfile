# =========================================================================
# Practical 11: Containerization with Docker and Docker Compose
# Frontend Dockerfile for React (Vite) Application (Step 3)
# =========================================================================

# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies inside container
RUN npm install

# Copy entire frontend source code
COPY . .

# Build production bundle into /app/dist
RUN npm run build

# Expose Vite preview port
EXPOSE 5173

# Serve production build on 0.0.0.0:5173 so host can connect
CMD ["npm", "run", "preview", "--", "--host"]
