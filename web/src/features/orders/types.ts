import { User } from "../auth/types";
import { Product } from "../products/types";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "FAILED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type Order = {
  id: string;
  userId: string;
  user?: Pick<User, "id" | "username" | "firstName" | "lastName" | "email">;
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
  product?: Product | null;
  orderId: string;
  quantity: number;
  unitPrice: number;
};
