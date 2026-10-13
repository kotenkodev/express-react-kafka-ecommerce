import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { productRoutes } from "./routes/product.routes";
import { errorHandler } from "@ecommerce/shared";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

app.use("/products", productRoutes);

app.get("/products/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "product-service" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});

export default app;
