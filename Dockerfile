# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
