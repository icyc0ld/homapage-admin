# Multi-arch lightweight management backend for homepage
# Supports linux/amd64 and linux/arm64

FROM node:22-alpine AS runner

# Install sshpass + openssh-client for SSH-based config sync to remote homepage
RUN apk add --no-cache sshpass openssh-client

WORKDIR /app

# Install backend dependencies
COPY backend/package.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy application code
COPY backend ./backend
COPY frontend ./frontend

# Ensure data directory exists
RUN mkdir -p /app/backend/data

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "backend/src/index.js"]
