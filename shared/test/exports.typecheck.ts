import { z, Role, OrderStatus, PaymentStatus, HttpError } from "@ecommerce/shared";
import type {
  AuthenticatedUser, UserRole, User, Product, Order, OrderItem,
} from "@ecommerce/shared";
import type { User as SubpathUser } from "@ecommerce/shared/types";

export const schema = z.object({ id: z.number(), role: z.nativeEnum(Role) });
export const orderStatus: Order["status"] = OrderStatus.PENDING;
export const paymentStatus: Order["paymentStatus"] = PaymentStatus.PENDING;
export const error = new HttpError("Test", 400);
export const role: UserRole = Role.user;
export const identity: AuthenticatedUser = { id: 1, role };

export type Entities = [User, SubpathUser, Product, Order, OrderItem];
