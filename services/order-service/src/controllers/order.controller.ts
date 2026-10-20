import { Request, Response } from "express";
import { orderService } from "../services/order.service";
import { RequestWithUser } from "@ecommerce/shared";
import { IdempotencyService } from "../services/idempotency.service";

export class OrderController {
  async createOrder(req: Request, res: Response) {
    const { user } = req as RequestWithUser;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    if (idempotencyKey) {
      const lockStatus = await IdempotencyService.acquire(
        user.id,
        idempotencyKey,
      );
      if (lockStatus === "IN_PROGRESS") {
        return res.status(409).json({
          error: "Order is already being processed. Please wait.",
        });
      }
      if (typeof lockStatus === "object") {
        return res.status(200).json(lockStatus);
      }
    }
    try {
      const order = await orderService.createOrder(user.id, req.body);
      if (idempotencyKey) {
        await IdempotencyService.save(user.id, idempotencyKey, order);
      }
      return res.status(200).json(order);
    } catch (error) {
      if (idempotencyKey) {
        await IdempotencyService.release(user.id, idempotencyKey);
      }
      throw error;
    }
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
