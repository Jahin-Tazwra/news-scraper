FROM ghcr.io/puppeteer/puppeteer:24.2.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    NODE_VERSION=18.18.0 \
WORKDIR=/usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "index" ]
