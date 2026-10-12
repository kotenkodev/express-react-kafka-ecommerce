export type UserRole = "user" | "admin";

export interface AuthenticatedUser {
  id: number;
  email?: string;
  role: UserRole;
}
