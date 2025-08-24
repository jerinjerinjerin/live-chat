# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./

# Set npm registry and retry policies to avoid network issues
RUN npm config set registry https://registry.npmjs.org/ \
    && npm set fetch-retries 5 \
    && npm set fetch-retry-mintimeout 20000 \
    && npm set fetch-retry-maxtimeout 120000 \
    && npm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copy built files and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Generate Prisma Client (Production)
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
