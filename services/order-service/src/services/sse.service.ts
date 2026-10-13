export class OrderSSEService {
  async emit(event: string, message: any) {}
}

export const sseService = new OrderSSEService();
