# Use a lightweight Node 18 Alpine base image
FROM node:18-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory inside the container
WORKDIR /app

# Copy only dependency files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of your project files (including configuration files)
COPY . .

# Expose Next.js default port
EXPOSE 3000

# Run the development server
CMD ["pnpm", "run", "dev"]