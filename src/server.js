import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import adminUsersRoutes from "./routes/admin/AdminUsers.routes.js";

const app = express();

// Middleware
app.use(morgan("dev")); // Logs requests to console
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin/users", adminUsersRoutes);

// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Root Route
app.get("/", (req, res) => {
    res.send("Backend API is running!");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default app;
