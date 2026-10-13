export class OrderService {
  async createOrder(userId: string, payload: any) {}

  async getOrder(userId: string, orderId: string) {}

  async getOrders(userId: string) {}
}

export const orderService = new OrderService();
