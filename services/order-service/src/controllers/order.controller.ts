import { Request, Response } from "express";

export class OrderController {
  async createOrder(req: Request, res: Response) {}

  async getOrder(req: Request, res: Response) {
    res.status(200).json({ message: "Order found" });
  }

  async getOrders(req: Request, res: Response) {
    res.status(200).json({ message: "Orders found" });
  }
}

export const orderController = new OrderController();
