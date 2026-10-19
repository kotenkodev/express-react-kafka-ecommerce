export interface Product {
  id: string;
  name: string;
  emoji?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
