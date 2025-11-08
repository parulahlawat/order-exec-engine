# Node 20
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || npm i
COPY . .
RUN npm run build
CMD ["node", "dist/server.js"]
