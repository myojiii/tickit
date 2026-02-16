import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import categoryRoutes from "./routes/categories.js";
import ticketRoutes from "./routes/tickets.js";
import messageRoutes from "./routes/messages.js";
import { ensureAssignedTicketsOpen } from "./lib/ticketHelpers.js";
import notificationRoutes from "./routes/notifications.js";
import reportRoutes from "./routes/reports.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL =
  process.env.MONGO_URL || "mongodb+srv://ticketing:pass123@ticketing.l4d0k5r.mongodb.net/";
const rootDir = process.cwd();

app.use(express.json());

// Public routes (no auth required)
app.use("/auth", express.static(path.join(rootDir, "public", "auth")));
app.use("/scripts/auth-guard.js", express.static(path.join(rootDir, "public", "scripts", "auth-guard.js")));
app.use("/styles", express.static(path.join(rootDir, "public", "styles")));
app.use("/assets", express.static(path.join(rootDir, "public", "assets")));

// Protected static routes (auth required for HTML pages)
app.use("/admin", express.static(path.join(rootDir, "public", "admin")));
app.use("/staff", express.static(path.join(rootDir, "public", "staff")));
app.use("/client", express.static(path.join(rootDir, "public", "client")));
app.use("/scripts", express.static(path.join(rootDir, "public", "scripts")));
app.use("/modals", express.static(path.join(rootDir, "public", "modals")));

app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "public", "auth", "login.html"));
});

// MongoDB Connection
mongoose
  .connect(MONGO_URL)
  .then(async () => {
    console.log("MongoDB connected");
    await ensureAssignedTicketsOpen();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Routes
app.use(authRoutes); // No auth required for login
app.use("/api", requireAuth); // Protect all API routes
app.use(userRoutes);
app.use(categoryRoutes);
app.use(ticketRoutes);
app.use(messageRoutes);
app.use(notificationRoutes);
app.use(reportRoutes);

// Only listen in development (local)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
