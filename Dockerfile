# Step 1: Build the frontend
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Run the backend
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
# Install only production dependencies
RUN npm install --production
# Copy server files
COPY server ./server
# Copy the built frontend from Step 1
COPY --from=build /app/dist ./dist

EXPOSE 3001

# Start the server
CMD ["npm", "start"]
