import { Request, Response } from "express";
import { createSession, createChannel, Channel, Session } from "better-sse";
import { RequestWithUser } from "@ecommerce/shared";

const ordersChannel: Channel = createChannel();

export class OrderSSESController {
  async stream(req: Request, res: Response) {
    const { user } = req as RequestWithUser;

    const session: Session = await createSession(req, res);

    session.data = {
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
  }) {
    ordersChannel.broadcast(order, "order.status.updated", {
      filter: (session) => {
        const sessionUser = session.data as { userId: string; role: string };
        return (
          sessionUser.role === "admin" || sessionUser.userId === order.userId
        );
      },
    });
  }
}

export const orderSSEController = new OrderSSESController();
