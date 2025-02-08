# Dockerfile for the DuckDuckGo Web Search MCP Server

FROM node:23-alpine

# Install Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy built files
COPY build/ build/

# Add executable permission to the entry point
RUN chmod +x build/index.js

# Run as non-root user for security
USER node

CMD ["node", "build/index.js"]