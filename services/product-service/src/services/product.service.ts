import { Category, Prisma, prisma } from "@ecommerce/shared";
import { ProductQueryInput } from "../schemas/product-query.schema";
import { ProductCreateInput } from "../schemas/product.schema";
import { ProductError } from "../lib/error";
import { Product } from "@ecommerce/shared";

export class ProductService {
  async getProducts(query: ProductQueryInput): Promise<Product[]> {
    const whereStatement: Prisma.ProductWhereInput = {};

    if (query.q) {
      whereStatement.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }

    if (query.category) {
      whereStatement.category = {
        name: {
          equals: query.category,
          mode: "insensitive",
        },
      };
    }
    if (query.minPrice) {
      whereStatement.price = {
        gte: query.minPrice,
      };
    }
    if (query.maxPrice) {
      whereStatement.price = {
        lte: query.maxPrice,
      };
    }
    if (query.inStock) {
      whereStatement.stock = {
        gt: 0,
      };
    }

    const products = await prisma.product.findMany({
      where: whereStatement,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return products;
  }

  async getCategories(): Promise<Category[]> {
    return prisma.category.findMany({});
  }

  async getProduct(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new ProductError(`Product with ID ${id} not found`, 404);
    }

    return product;
  }

  async createProduct(payload: ProductCreateInput): Promise<Product> {
    const { category, ...body } = payload;

    return prisma.product.create({
      data: {
        ...body,
        category: {
          connect: { name: category },
        },
      },
      include: {
        category: true,
      },
    });
  }

  async updateProduct(id: string, payload: any): Promise<Product> {
    const { category, ...body } = payload;
    try {
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          ...body,
          ...(category ? { category: { connect: { name: category } } } : {}),
        },
        include: {
          category: true,
        },
      });
      return updatedProduct;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new ProductError(`Product with ID ${id} not found`, 404);
      }
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await prisma.product.delete({
        where: { id },
      });
      return;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new ProductError(`Product with ID ${id} not found`, 404);
      }
      throw error;
    }
  }
}

export const productService = new ProductService();
