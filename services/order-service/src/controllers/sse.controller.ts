import { Request, Response } from "express";

export class OrderSSESController {
  async stream(req: Request, res: Response) {}
}

export const orderSSEController = new OrderSSESController();
