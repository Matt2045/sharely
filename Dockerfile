# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments für öffentliche Env-Variablen (werden beim Build eingebunden)
ARG VITE_SYNCFUSION_LICENSE_KEY
ARG VITE_APPWRITE_PROJECT_ID
ARG VITE_APPWRITE_ENDPOINT_API
ARG VITE_APPWRITE_PINTEREST_DATABASE_ID
ARG VITE_APPWRITE_USERS_COLLECTION
ARG VITE_APPWRITE_PINS_COLLECTION
ARG VITE_APPWRITE_SAVED_PINS_COLLECTION
ARG VITE_APPWRITE_LIKED_PINS_COLLECTION
ARG VITE_APPWRITE_STORAGE_BUCKET_ID
ARG VITE_UNSPLASH_API_ACCESS_KEY

# Setze Build-Zeit Env-Variablen
ENV VITE_SYNCFUSION_LICENSE_KEY=$VITE_SYNCFUSION_LICENSE_KEY
ENV VITE_APPWRITE_PROJECT_ID=$VITE_APPWRITE_PROJECT_ID
ENV VITE_APPWRITE_ENDPOINT_API=$VITE_APPWRITE_ENDPOINT_API
ENV VITE_APPWRITE_PINTEREST_DATABASE_ID=$VITE_APPWRITE_PINTEREST_DATABASE_ID
ENV VITE_APPWRITE_USERS_COLLECTION=$VITE_APPWRITE_USERS_COLLECTION
ENV VITE_APPWRITE_PINS_COLLECTION=$VITE_APPWRITE_PINS_COLLECTION
ENV VITE_APPWRITE_SAVED_PINS_COLLECTION=$VITE_APPWRITE_SAVED_PINS_COLLECTION
ENV VITE_APPWRITE_LIKED_PINS_COLLECTION=$VITE_APPWRITE_LIKED_PINS_COLLECTION
ENV VITE_APPWRITE_STORAGE_BUCKET_ID=$VITE_APPWRITE_STORAGE_BUCKET_ID
ENV VITE_UNSPLASH_API_ACCESS_KEY=$VITE_UNSPLASH_API_ACCESS_KEY

# Build the application
RUN npm run build

# ============================================
# Stage 2: Production Stage
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/instrument.server.mjs ./instrument.server.mjs

# Expose port
EXPOSE 3000

# Runtime Environment Variables (Secrets - werden NICHT ins Image gebacken)
ENV NODE_ENV=production
ENV NODE_OPTIONS="--import ./instrument.server.mjs"

# Start application
CMD ["npx", "react-router-serve", "./build/server/index.js"]