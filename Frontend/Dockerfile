# ─── Frontend/Dockerfile ───────────────────────────────────────────────────────
FROM node:22

WORKDIR /app

# 1. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy the rest of your source (including src/, vite.config.ts, etc.)
COPY . .

# 3. Expose port for Vite dev server
EXPOSE 3000

# 4. Run the Vite dev server (will be overridden by docker-compose command)
CMD ["npm", "run", "dev"]
