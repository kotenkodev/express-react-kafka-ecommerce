import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

export default app;
