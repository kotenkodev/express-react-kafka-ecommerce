import { HttpError } from "@ecommerce/shared";

export class ProductError extends HttpError {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode);
    this.name = "ProductError";
  }
}
