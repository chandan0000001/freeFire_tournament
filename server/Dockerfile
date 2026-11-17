# Production Dockerfile for RIT Esports Arena Server
FROM node:20-alpine

# Install dumb-init for proper signal forwarding and graceful container shutdown
RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY src/ ./src/
COPY uploads/ ./uploads/

# Ensure runtime evidence upload directory exists
RUN mkdir -p uploads/evidence

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Run container as non-root user for security
USER node

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "src/server.js"]
