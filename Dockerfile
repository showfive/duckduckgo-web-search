# Dockerfile for the DuckDuckGo Web Search MCP Server

FROM node:23-alpine

WORKDIR /usr/src/app

COPY build/* build/
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --omit=dev

EXPOSE 8080
CMD ["node", "build/index.js"]