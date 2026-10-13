import { Prisma, prisma } from "@ecommerce/shared";
import { ProductQueryInput } from "../schemas/product-query.schema";
import { ProductCreateInput } from "../schemas/product.schema";
import { ProductError } from "../lib/error";

export class ProductService {
  async getProducts(query: ProductQueryInput) {
    const whereStatement: Prisma.ProductWhereInput = {};

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

  getCategories() {
    return prisma.category.findMany({
      distinct: ["name"],
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getProduct(id: string) {
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

  async createProduct(payload: ProductCreateInput) {
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

  async updateProduct(id: string, payload: any) {
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

  async deleteProduct(id: string) {
    try {
      const updatedProduct = await prisma.product.delete({
        where: { id },
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
}

export const productService = new ProductService();
