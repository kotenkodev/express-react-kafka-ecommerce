import { Request, Response } from "express";
import { orderService } from "../services/order.service";
import { RequestWithUser } from "@ecommerce/shared";

export class OrderController {
  async createOrder(req: Request, res: Response) {
    const { user } = req as RequestWithUser;

    const order = await orderService.createOrder(user.id, req.body);
    res.status(200).json(order);
  }

  async getOrder(req: Request, res: Response) {
    const { user } = req as RequestWithUser;
    const { id } = req.params;
    const order = await orderService.getOrder(user, id as string);
    res.status(200).json(order);
  }

  async getOrders(req: Request, res: Response) {
    const { user } = req as RequestWithUser;
    const orders = await orderService.getOrders(user);
    res.status(200).json(orders);
  }
}

export const orderController = new OrderController();
