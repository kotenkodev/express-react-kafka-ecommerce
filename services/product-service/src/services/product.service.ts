import { Category, Prisma, prisma } from "@ecommerce/shared";
import { ProductQueryInput } from "../schemas/product-query.schema";
import {
  ProductCreateInput,
  ProductUpdateInput,
} from "../schemas/product.schema";
import { ProductError } from "../lib/error";
import { Product } from "@ecommerce/shared";

export class ProductService {
  async getProducts(query: ProductQueryInput): Promise<{
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
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

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      whereStatement.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.inStock) {
      whereStatement.stock = {
        gt: 0,
      };
    }

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const [total, products] = await prisma.$transaction(
      [
        prisma.product.count({ where: whereStatement }),
        prisma.product.findMany({
          where: whereStatement,
          include: {
            category: true,
          },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          skip,
          take: limit,
        }),
      ],
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCategories(): Promise<Category[]> {
    return prisma.category.findMany({});
  }

  async getProduct(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new ProductError(`Product with ID ${id} not found`, 404);
    }

    return product;
  }

  async createProduct(payload: ProductCreateInput): Promise<Product> {
    const { category, ...body } = payload;

    const existingCategory = await prisma.category.findUnique({
      where: { name: category },
    });
    if (!existingCategory) {
      throw new ProductError(`Category "${category}" not found`, 400);
    }

    return prisma.product.create({
      data: {
        ...body,
        categoryId: existingCategory.id,
      },
      include: {
        category: true,
      },
    });
  }

  async updateProduct(
    id: string,
    payload: ProductUpdateInput,
  ): Promise<Product> {
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new ProductError(`Product with ID ${id} not found`, 404);
    }

    const { category, ...body } = payload;
    let categoryId: string | undefined;

    if (category !== undefined) {
      const existingCategory = await prisma.category.findUnique({
        where: { name: category },
      });
      if (!existingCategory) {
        throw new ProductError(`Category "${category}" not found`, 400);
      }
      categoryId = existingCategory.id;
    }

    return prisma.product.update({
      where: { id },
      data: {
        ...body,
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
      },
    });
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new ProductError(`Product with ID ${id} not found`, 404);
        }
        if (error.code === "P2003") {
          throw new ProductError(
            `Cannot delete product with ID ${id} because it is referenced in existing orders`,
            409,
          );
        }
      }
      throw error;
    }
  }
}

export const productService = new ProductService();
