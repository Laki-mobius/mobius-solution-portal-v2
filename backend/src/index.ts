import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth";
import solutionsRoutes from "./routes/solutions";
import collateralsRoutes from "./routes/collaterals";
import credentialsRoutes from "./routes/credentials";
import activityRoutes from "./routes/activity";
import uploadRoutes from "./routes/upload";
import usersRoutes from "./routes/users";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/solutions", solutionsRoutes);
app.use("/api/collaterals", collateralsRoutes);
app.use("/api/solutions", credentialsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", usersRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});