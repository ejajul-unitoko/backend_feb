Backend Tech Stack & Setup Guide
This document provides a breakdown of the current backend architecture and instructions for setting up a similar system.

1. Tech Stack Overview
   Core Runtime & Framework
   Runtime: Node.js (ES Modules)
   Framework: Express.js - Fast, unopinionated, minimalist web framework.
   Database
   Database: PostgreSQL
   Driver: pg (node-postgres) - Non-blocking PostgreSQL client for Node.js.
   Security & Authentication
   Authentication: JWT (JSON Web Tokens) using jsonwebtoken.
   Hashing: bcrypt for secure password storage.
   Security Middleware:
   helmet: Sets various HTTP headers for security.
   cors: Cross-Origin Resource Sharing.
   express-rate-limit: Basic rate limiting.
   Validation & Utilities
   Validation: joi - Schema description language and data validator.
   Environment: dotenv - Loads environment variables from
   .env
   .
   File Handling: multer for uploads, sharp for image processing.
   Logging: Custom logger using standard output/files (likely based on pino or winston concepts).
   External Services
   AWS: S3 (Storage), SES (Email), SNS (SMS).
   Firebase: firebase-admin for push notifications.
   Email: nodemailer for SMTP.
2. Architectural Pattern
   The project follows a Layered Architecture (Controller-Service-Repository):

Routes: Define API endpoints and link them to controllers.
Controllers: Handle HTTP requests, extract data, and call services.
Services: Contain business logic. They are independent of HTTP and interact with repositories.
Repositories: Contain database-specific logic and raw SQL queries.
Middleware: Handles cross-cutting concerns (Auth, Error Handling, Logging, Rate Limiting).
Jobs/Workers: Background processes for long-running or scheduled tasks (e.g., Notification Worker). 3. Project Structure
src/
├── config/ # Database and app configuration
├── controllers/ # Request handlers
├── services/ # Business logic
├── repositories/ # Database access layer
├── routes/ # Route definitions
├── middleware/ # Custom handlers (auth, error, etc.)
├── jobs/ # Background workers
├── validators/ # Joi validation schemas
├── utils/ # Helper functions and logger
├── index.js # Entry point (starts workers and server)
└── server.js # Express app setup 4. Setup Instructions (New Project)
Step 1: Initialize Project
mkdir my-backend
cd my-backend
npm init -y
Step 2: Install Core Dependencies
npm install express pg dotenv cors helmet jsonwebtoken bcrypt joi multer
npm install --save-dev eslint prettier typescript
Step 3: Configure
package.json
Set "type": "module" to use ES Modules.

Step 4: Environment Variables (
.env
)
Create a
.env
file with the following keys:

PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/dbname
JWT_SECRET=your_super_secret_key
Step 5: Database Connection
Create
src/config/database.js
:

import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default pool;
Step 6: Create the Express Server
Create
src/server.js
to initialize Express, middleware, and routes.

Step 7: Define the Entry Point
Create
src/index.js
to connect to the DB and call app.listen().

5. Docker Setup (Recommended)
   Using Docker ensures that your development environment (especially the database) is consistent across different machines.

Database with Docker Compose
The current project uses Docker primarily for the PostgreSQL database (with PostGIS).

Create a
docker-compose.yml
file:

version: '3.8'
services:
postgres:
image: postgis/postgis:17-3.4-alpine
container_name: my_backend_postgres
environment:
POSTGRES_DB: backend_db
POSTGRES_USER: backend_user
POSTGRES_PASSWORD: backend_password
PGDATA: /var/lib/postgresql/data/pgdata
ports: - "5432:5432"
volumes: - postgres_data:/var/lib/postgresql/data
healthcheck:
test: ["CMD-SHELL", "pg_isready -U backend_user -d backend_db"]
interval: 10s
timeout: 5s
retries: 5
restart: unless-stopped
networks: - backend_network
volumes:
postgres_data:
driver: local
networks:
backend_network:
driver: bridge
Full Containerization (Optional)
If you want to run the entire backend in Docker, follow these steps:

Create a Dockerfile:

# Use Node.js LTS

FROM node:20-alpine

# Set working directory

WORKDIR /app

# Copy package files and install dependencies

COPY package\*.json ./
RUN npm install

# Copy the rest of the application

COPY . .

# Expose the API port

EXPOSE 3000

# Start the application

CMD ["npm", "start"]
Update
docker-compose.yml
to include the app:
app:
build: .
ports: - "3000:3000"
environment: - DATABASE_URL=postgresql://backend_user:backend_password@postgres:5432/backend_db
depends_on:
postgres:
condition: service_healthy
networks: - backend_network 6. Development Workflow
Database Control:
docker-compose up -d (Start the DB)
docker-compose down (Stop the DB)
Migrations: Use a folder like migrations/ and a script to run raw SQL files.
Testing: Use jest for unit and integration tests.
Linting: Consistent code style using eslint.

Comment
Ctrl+Alt+M
