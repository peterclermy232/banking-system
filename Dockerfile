FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application - try production first, fallback to dev build
RUN npm run build -- --configuration=production || npm run build -- --configuration=production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built application from the build stage
COPY --from=build /app/dist/banking-system /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
