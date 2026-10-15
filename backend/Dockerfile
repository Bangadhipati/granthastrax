# Production Dockerfile for GranthAstraX Backend with Tectonic + Puppeteer
FROM node:20-bookworm-slim

# Install system utilities, fontconfig libraries, Puppeteer/Chromium, and OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    fontconfig \
    libfontconfig1 \
    libfreetype6 \
    libharfbuzz0b \
    libgraphite2-3 \
    libicu72 \
    openssl \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Tectonic (modern, standalone, on-demand LaTeX compiler in Rust)
RUN curl -fsSL https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-musl.tar.gz | tar -xz -C /usr/local/bin && \
    chmod +x /usr/local/bin/tectonic

# Configure Puppeteer to use the system-installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Configure writable cache directory for Tectonic on-demand package downloads
ENV TECTONIC_CACHE_DIR=/tmp/tectonic_cache
RUN mkdir -p /tmp/tectonic_cache && chmod -R 777 /tmp/tectonic_cache

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Default port for Render web services
ENV PORT=10000
EXPOSE 10000

# Start server
CMD ["node", "server.js"]
