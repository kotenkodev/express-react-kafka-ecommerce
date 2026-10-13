import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { env } from "./config/env";

dotenv.config();

const app = express();
const PORT = env.port;

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "analytics-service" });
});

app.listen(PORT, () => {
  console.log(`Analytics service running on port ${PORT}`);
});

export default app;
