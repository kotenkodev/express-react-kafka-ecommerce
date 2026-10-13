import { OrderStatus, PaymentStatus, Product } from "@prisma/client";

export type OrderCreated = {
  orderId: string;
  userId: string;
  items: Product[];
  totalAmount: number;
  createdAt: Date;
};

export type PaymentProcessed = {
  paymendId: string;
  orderId: string;
  status: PaymentStatus;
  processedAt: Date;
  failureReason: string | null;
};

export type OrderStatusUpdated = {
  orderId: string;
  status: OrderStatus;
  courier: string;
  updatedAt: Date;
};

export type OrderStats = {
  windowStart: Date;
  orderCount: number;
  totalRevenue: number;
  successRate: number;
  avgProcessingMs: number;
};
