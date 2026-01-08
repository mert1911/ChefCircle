# Use a slim Node.js image based on Alpine Linux for a smaller image size
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's caching.
# This allows Docker to cache the npm install layer if dependencies don't change.
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm install

# --- CRITICAL POINT 1: Copy ALL source code, including src/ ---
# This line copies everything from your build context (SEBA_SOSE25/Backend) into /app.
# This includes your 'src' folder (containing app.ts, index.ts, etc.).
COPY . .

# --- CRITICAL POINT 2: Build the TypeScript code INSIDE the container ---
# This command executes the 'build' script defined in your package.json (usually 'tsc'),
# which compiles your TypeScript source files in 'src' into JavaScript files in the 'dist' folder.
# This *must* happen after 'COPY . .' so that the 'src' files are available to 'tsc'.
RUN npm run build

# --- CRITICAL POINT 3: Verify contents of 'dist' folder inside Dockerfile (TEMPORARY DEBUGGING) ---
# Add these lines TEMPORARILY for debugging. They will print the contents of /app and /app/dist
# during the Docker build process, so you can see if index.js is actually there.
RUN ls -la /app
RUN ls -la /app/dist

# Expose the application port
EXPOSE 8080

# Switch to the non-root 'node' user for security best practice.
USER node

# Command to run the application when the container starts.
# This executes the 'start' script defined in your package.json, which typically runs 'node dist/index.js'.
# ONLY ONE CMD INSTRUCTION IS ALLOWED IN A DOCKERFILE. The last one overrides previous ones.
CMD ["npm", "run", "start:with-seed"]
