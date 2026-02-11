import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import adminUsersRoutes from "./routes/admin/AdminUsers.routes.js";
import adminBranchUsersRoutes from "./routes/admin/AdminBranchUsers.routes.js";
import publicRoutes from "./routes/public.routes.js";
import adminMarketsRoutes from "./routes/admin/markets.routes.js";
import adminBusinessesRoutes from "./routes/admin/businesses.routes.js";
import businessRoutes from "./routes/business/business.routes.js";
import branchRoutes from "./routes/business/branches.routes.js";
import branchUserRoutes from "./routes/business/branch_users.routes.js";
import customerAddressRoutes from "./routes/customer/addresses.routes.js";
import riderAddressRoutes from "./routes/delivery/addresses.routes.js";
import adminAddressRoutes from "./routes/admin/addresses.routes.js";
import adminCategoryRoutes from './routes/admin/categories.routes.js';
import adminProductRoutes from './routes/admin/products.routes.js';
import businessProductRoutes from './routes/business/products.routes.js';
import publicProductRoutes from './routes/public/products.routes.js';
import adminCustomerRoutes from './routes/admin/customer.routes.js';
import customerProfileRoutes from './routes/customer/customer.routes.js';
import businessCustomerRoutes from './routes/business/business_customer.routes.js';
import adminRiderRoutes from './routes/admin/riders.routes.js';
import riderRoutes from './routes/delivery/riders.routes.js';
import businessRiderLookupRoutes from './routes/business/rider_lookup.routes.js';



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
app.use("/api/uta", adminBranchUsersRoutes); // Mounted under /api/uta for admin branch user actions
app.use("/api/public", publicRoutes);
app.use("/api/admin/markets", adminMarketsRoutes);
app.use("/api/admin", adminBusinessesRoutes);
app.use("/api/utb", businessRoutes);
app.use("/api/utb", branchRoutes);
app.use("/api/utb", branchUserRoutes);
app.use("/api/utc/addresses", customerAddressRoutes);
app.use("/api/utd/addresses", riderAddressRoutes);
app.use("/api/admin/addresses", adminAddressRoutes);

// Admin Routes
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/products', adminProductRoutes);

// Business Routes
app.use('/api/utb', businessProductRoutes); // Mounts at /api/utb/branches/:id/products etc.

// Public Routes
app.use('/api/public', publicProductRoutes);

// Customer Management Routes
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/utc', customerProfileRoutes);
app.use('/api/utb', businessCustomerRoutes);

// Rider Management Routes
app.use('/api/admin/riders', adminRiderRoutes);
app.use('/api/utd', riderRoutes);
app.use('/api/utb/riders', businessRiderLookupRoutes);



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
