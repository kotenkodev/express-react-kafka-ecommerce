import { z } from "zod";

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, "refreshToken is required"),
  })
  .strict();

export type RefreshTokenInput = z.output<typeof refreshTokenSchema>;
