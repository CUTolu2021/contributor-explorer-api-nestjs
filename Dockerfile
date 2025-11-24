# Stage 1: Build the NestJS application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create the final, smaller runtime image
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm install --only=production

# Copy built application files from the builder stage
COPY --from=builder /app/dist ./dist
# Copy the .env file (for testing, but use AWS Secrets Manager in production)
COPY .env ./.env

# Expose the port used by NestJS
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]