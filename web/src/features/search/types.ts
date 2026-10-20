import { OrderStatus } from "../orders/types";

export interface SearchOrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface SearchOrderDocument {
  orderId: string;
  userId?: string;
  items?: SearchOrderItem[];
  totalAmount?: number;
  status: OrderStatus | string;
  courier?: string;
  paymentStatus?: "SUCCESS" | "FAILED";
  processedAt?: string;
  failureReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchOrdersResponse {
  orders: SearchOrderDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchOrdersParams {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}

