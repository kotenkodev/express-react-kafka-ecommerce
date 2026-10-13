export type UserRole = "user" | "admin";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
}
