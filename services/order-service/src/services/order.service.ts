import { AuthenticatedUser, HttpError, prisma } from "@ecommerce/shared";
import { OrderCreateInput } from "../schemas/order-create.schema";
import { publishOrderCreated } from "../producers/order.producer";

export class OrderService {
  async createOrder(userId: string, items: OrderCreateInput) {
    const consolidatedMap = new Map<string, number>();
    for (const item of items) {
      const currentQty = consolidatedMap.get(item.id) || 0;
      consolidatedMap.set(item.id, currentQty + item.quantity);
    }

    const consolidatedItems = Array.from(consolidatedMap.entries()).map(
      ([id, quantity]) => ({ id, quantity }),
    );

    const productIds = consolidatedItems.map((item) => item.id);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, stock: true, name: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;

    for (const item of consolidatedItems) {
      const product = productMap.get(item.id);
      if (!product) {
        throw new HttpError(`Product with ID ${item.id} not found`, 404);
      }
      if (product.stock < item.quantity) {
        throw new HttpError(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
          400,
        );
      }

      totalAmount += Number(product.price) * item.quantity;
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of consolidatedItems) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.id,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          throw new HttpError(
            `Stock changed. Insufficient items available.`,
            409,
          );
        }
      }

      return tx.order.create({
        data: {
          userId,
          totalAmount,
          items: {
            createMany: {
              data: consolidatedItems.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
                unitPrice: Number(productMap.get(item.id)?.price),
              })),
            },
          },
        },
        include: { items: true },
      });
    });

    await publishOrderCreated({
      orderId: order.id,
      userId: order.userId,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.unitPrice),
      })),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
    });

    return order;
  }

  async getOrder(user: AuthenticatedUser, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new HttpError(`Order with ID ${orderId} not found`, 404);
    }

    if (user.role !== "admin" && order.userId !== user.id) {
      throw new HttpError(`Unauthorized to access this order`, 403);
    }

    return order;
  }

  async getOrders(user: AuthenticatedUser) {
    return await prisma.order.findMany({
      ...(user.role === "user" ? { where: { userId: user.id } } : {}),
      include: {
        user:
          user.role === "admin"
            ? {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              }
            : false,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export const orderService = new OrderService();
