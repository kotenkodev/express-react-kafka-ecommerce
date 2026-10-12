import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRoutes } from "./routes/auth.routes";
import { errorHandler } from "@ecommerce/shared/src/http/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

export default app;
