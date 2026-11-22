# Root Dockerfile for Render / Container Deployments
FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app

# Copy server dependencies
COPY server/package*.json ./

RUN npm ci --omit=dev

# Copy server codebase
COPY server/src/ ./src/

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

USER node

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "src/server.js"]
