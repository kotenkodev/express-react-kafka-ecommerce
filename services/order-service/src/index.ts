import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { orderRoutes } from "./routes/order.routes";
import { sseRoutes } from "./routes/sse.routes";
import { errorHandler } from "@ecommerce/shared";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/orders", orderRoutes);

app.use("/orders/events", sseRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "order-service" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});

export default app;
