import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { ProductQueryInput } from "../schemas/product-query.schema";
import { ProductParamsInput } from "../schemas/product-params.schema";
import {
  ProductCreateInput,
  ProductUpdateInput,
} from "../schemas/product.schema";

export class ProductController {
  async getProducts(req: Request, res: Response) {
    const query = res.locals.query as ProductQueryInput;
    const { products, pagination } = await productService.getProducts(query);

    res.status(200).json({ products, pagination });
  }

  async getCategories(_req: Request, res: Response) {
    const categories = await productService.getCategories();

    res.status(200).json(categories);
  }

  async getProduct(req: Request, res: Response) {
    const { id } = req.params as ProductParamsInput;

    const product = await productService.getProduct(id);
    res.status(200).json(product);
  }

  async createProduct(req: Request, res: Response) {
    const body = req.body as ProductCreateInput;

    const product = await productService.createProduct(body);
    res.status(201).json(product);
  }

  async updateProduct(req: Request, res: Response) {
    const { id } = req.params as ProductParamsInput;
    const body = req.body as ProductUpdateInput;

    const product = await productService.updateProduct(id, body);
    res.status(200).json(product);
  }

  async deleteProduct(req: Request, res: Response) {
    const { id } = req.params as ProductParamsInput;

    await productService.deleteProduct(id);
    res.status(204).send();
  }
}

export const productController = new ProductController();
