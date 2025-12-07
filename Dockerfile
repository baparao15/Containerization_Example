# Multi-stage Dockerfile for HeirloomHub

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# ============================================
# Stage 2: Build Backend
# ============================================
FROM node:18-alpine AS backend-build

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Create necessary directories
RUN mkdir -p data uploads/seed

# ============================================
# Stage 3: Production Image
# ============================================
FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy backend from build stage
COPY --from=backend-build /app/backend ./backend

# Copy frontend build from build stage
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/http.d/default.conf

# Create necessary directories
RUN mkdir -p /app/backend/data /app/backend/uploads /run/nginx

# Expose ports
EXPOSE 80 5000

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo '# Run seed script with timeout in background' >> /app/start.sh && \
    echo 'timeout 10 node seed.js &' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo '# Start backend server' >> /app/start.sh && \
    echo 'node server.js &' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo '# Start nginx' >> /app/start.sh && \
    echo 'nginx -g "daemon off;"' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start both backend and nginx
CMD ["/app/start.sh"]
