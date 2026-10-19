export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "FAILED"
  | "CANCELED"
  | "PACKAGING"
  | "SHIPPING";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  courier?: string | null;
  statusUpdatedAt?: Date | null;
};

export type OrderItem = {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
  unitPrice: number;
};
