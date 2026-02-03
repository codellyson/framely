# ─── Framely Render Server ───
# Contains: Node.js + Playwright (Chromium) + FFmpeg

FROM node:20-bookworm-slim

# Install system dependencies for Playwright and FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    # Playwright Chromium dependencies
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libcups2 \
    libgtk-3-0 \
    libx11-xcb1 \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy application code
COPY . .

# Create outputs directory
RUN mkdir -p outputs

EXPOSE 4000

ENV PORT=4000
# The frontend URL — the Docker container needs to reach the Vite dev server.
# When using docker-compose, this will be the host machine's address.
ENV FRONTEND_URL=http://host.docker.internal:3000

CMD ["node", "server.js"]
