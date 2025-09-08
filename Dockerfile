# Use Node.js 20 on Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (leverage Docker layer caching)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
