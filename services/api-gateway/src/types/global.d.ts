import type { AuthenticatedUser } from "@ecommerce/shared/types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
