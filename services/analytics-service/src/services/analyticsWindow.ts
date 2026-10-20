import { orderProcessingDuration } from "@ecommerce/shared";
import { env } from "../config/env";
import { SlidingWindowService } from "./slidingWindow";

export const slidingWindowService = new SlidingWindowService(
  60_000,
  env.correlationRetentionMs,
  ms => orderProcessingDuration.observe(ms / 1000),
);
