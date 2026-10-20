# =========================================================================
# Practical 11: Containerization with Docker and Docker Compose
# Backend Dockerfile for Node/Express RESTful API
# Uses Node 22 Alpine for full Mongoose 9 / MongoDB 7 compatibility
# =========================================================================

# 1. Base image: Official Node.js 22 LTS Alpine
FROM node:22-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package descriptors first to leverage Docker layer caching
COPY package*.json ./

# 4. Install production dependencies inside the container
RUN npm install

# 5. Copy the rest of the application source code
COPY . .

# 6. Document the port the application listens on
EXPOSE 5000

# 7. Start the Node.js Express server
CMD ["node", "server.js"]
