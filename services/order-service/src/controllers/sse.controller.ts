import { Request, Response } from "express";
import { createSession, createChannel, Channel, Session } from "better-sse";
import { RequestWithUser } from "@ecommerce/shared";

const ordersChannel: Channel = createChannel();

export class OrderSSESController {
  async stream(req: Request, res: Response) {
    const { user } = req as RequestWithUser;

    const session: Session = await createSession(req, res);

    session.state = {
      userId: user.id,
      role: user.role,
    };

    ordersChannel.register(session);
  }

  broadcastOrderStatus(order: {
    id: string;
    userId: string;
    status: string;
    courier?: string;
    updatedAt?: string;
  }) {
    const payload = {
      ...order,
      orderId: order.id,
    };

    const filter = (session: Session) => {
      const sessionUser = session.state as {
        userId: string;
        role: string;
      };

      return (
        sessionUser.role === "admin" || sessionUser.userId === order.userId
      );
    };

    ordersChannel.broadcast(payload, "order_update", { filter });
    ordersChannel.broadcast(payload, "order.status.updated", { filter });
  }
}

export const orderSSEController = new OrderSSESController();
