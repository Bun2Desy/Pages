# Stage 1: Build the application
FROM node:22 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including Puppeteer)
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Stage 2: Production image
FROM node:22 AS production

# Install necessary packages for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    fonts-liberation \
    libasound2 \
    libvulkan1 \
    libappindicator3-1 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgbm-dev \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxrandr2 \
    libxss1 \
    xdg-utils \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

    RUN apt-get update && apt-get install -y gnupg wget && \
    wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app .

# Expose the application ports
EXPOSE 5000 5001

# Set environment variables
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "app.js"]