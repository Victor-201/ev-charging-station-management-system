FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for ts-node)
RUN npm install

# Copy source code
COPY src ./src
COPY config ./config
COPY tests ./tests

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start application with ts-node (no build needed)
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
