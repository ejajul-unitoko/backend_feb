import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import adminUsersRoutes from "./routes/admin/AdminUsers.routes.js";
import publicRoutes from "./routes/public.routes.js";
import adminMarketsRoutes from "./routes/admin/markets.routes.js";
import adminBusinessesRoutes from "./routes/admin/businesses.routes.js";
import businessRoutes from "./routes/business/business.routes.js";
import branchRoutes from "./routes/business/branches.routes.js";
import branchUserRoutes from "./routes/business/branch_users.routes.js";

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
app.use("/api/public", publicRoutes);
app.use("/api/admin/markets", adminMarketsRoutes);
app.use("/api/admin", adminBusinessesRoutes);
app.use("/api/utb", businessRoutes);
app.use("/api/utb", branchRoutes);
app.use("/api/utb", branchUserRoutes);

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
