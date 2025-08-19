# Multi-stage build for React frontend
FROM node:24-alpine AS frontend-build

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install frontend dependencies
RUN npm install

# Copy frontend source code
COPY src ./src
COPY public ./public
COPY index.html ./
COPY eslint.config.js ./

# Build the frontend
RUN npm run build

# Production stage
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/
WORKDIR /app/server

# Install server dependencies
RUN npm install --only=production

# Copy server source code
COPY server/index.js ./

# Copy built frontend from build stage
COPY --from=frontend-build /app/frontend/dist /app/server/public

# Expose port
EXPOSE 4000

# Set working directory back to server
WORKDIR /app/server

# Start the server
CMD ["node", "index.js"]
