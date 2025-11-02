FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port (Render will set PORT env var)
EXPOSE ${PORT:-5000}

# Start the application (production mode)
CMD ["node", "server.js"]
