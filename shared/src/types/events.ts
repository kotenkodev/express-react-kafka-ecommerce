export type OrderCreated = {
  orderId: string;
  userId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  createdAt: string;
};

export type PaymentProcessed = {
  paymentId: string;
  orderId: string;
  status: "SUCCESS" | "FAILED";
  processedAt: string;
  failureReason: string | null;
};

export type OrderStatusUpdated = {
  orderId: string;
  status: "PREPARING" | "SHIPPED" | "DELIVERED";
  courier: string;
  updatedAt: string;
};

export type OrderStats = {
  windowStart: string;
  ordersCount: number;
  totalRevenue: number;
  successRate: number;
  avgProcessingMs: number;
};

export type DeadLetterMessage<T> = {
  originalMessage: T;
  error: string;
  retryCount: number;
  failedAt: string;
};
