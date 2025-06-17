# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Set up environment
RUN cp .env.example .env.local

# Build the application
RUN npm run build

# Expose port 5173 for Vite preview
EXPOSE 5173

# Start the preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
