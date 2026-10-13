import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { ProductQueryInput } from "../schemas/product-query.schema";
import { ProductParamsInput } from "../schemas/product-params.schema";
import {
  ProductCreateInput,
  ProductUpdateInput,
} from "../schemas/product.schema";

export class ProductController {
  getProducts(req: Request, res: Response) {
    const query = req.query as ProductQueryInput;

    const products = productService.getProducts(query);
    res.status(200).json({ success: true, data: products });
  }

  getCategories(req: Request, res: Response) {}

  getProduct(req: Request, res: Response) {
    const { id } = req.params as ProductParamsInput;

    const product = productService.getProduct(id);
    res.status(200).json({ success: true, data: product });
  }

  createProduct(req: Request, res: Response) {
    const body = req.body as ProductCreateInput;

    const product = productService.createProduct(body);
    res.status(201).json({ success: true, data: product });
  }

  updateProduct(req: Request, res: Response) {
    const { id } = req.params as ProductParamsInput;
    const body = req.body as ProductUpdateInput;

    const product = productService.updateProduct(id, body);
    res.status(200).json({ success: true, data: product });
  }

  deleteProduct(req: Request, res: Response) {
    const { id } = req.params as ProductParamsInput;

    productService.deleteProduct(id);
    res.status(204).send();
  }
}

export const productController = new ProductController();
