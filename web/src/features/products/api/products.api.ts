import axios from "@/lib/axios";
import { ProductQueryInput } from "../schemas/product-query.schema";
import {
  ProductCreateInput,
  ProductUpdateInput,
} from "../schemas/product.schema";
import { Category, Product } from "../types";

const PRODUCT_URL = "/products";

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getProducts = async (
  payload?: ProductQueryInput,
): Promise<{ products: Product[]; pagination: PaginationResponse }> => {
  const response = await axios.get(`${PRODUCT_URL}/`, { params: payload });
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get(`${PRODUCT_URL}/categories`);
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await axios.get(`${PRODUCT_URL}/${id}`);
  return response.data;
};

export const createProduct = async (
  payload: ProductCreateInput,
): Promise<Product> => {
  const response = await axios.post(`${PRODUCT_URL}`, payload);
  return response.data;
};

export const updateProduct = async (
  id: string,
  payload: ProductUpdateInput,
): Promise<Product> => {
  const response = await axios.put(`${PRODUCT_URL}/${id}`, payload);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const response = await axios.delete(`${PRODUCT_URL}/${id}`);
  return response.data;
};
