import axios from "@/lib/axios";
import { Order } from "../types";

const ORDER_URL = "/orders";

export interface CreateOrderItemInput {
  id: string;
  quantity: number;
}

export const createOrder = async (
  payload: CreateOrderItemInput[],
): Promise<Order> => {
  const response = await axios.post(`${ORDER_URL}`, payload);
  return response.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const response = await axios.get(`${ORDER_URL}`);
  return response.data;
};

export const getOrderById = async (id: string): Promise<Order> => {
  const response = await axios.get(`${ORDER_URL}/${id}`);
  return response.data;
};
