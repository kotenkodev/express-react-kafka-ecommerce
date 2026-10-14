type RetryOptions = {
  retries?: number;
  initialRetryTime?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { retries = 3, initialRetryTime = 1000 } = options;

  if (!Number.isInteger(retries) || retries < 0) {
    throw new Error("Retries must be a non-negative integer");
  }

  if (!Number.isInteger(initialRetryTime) || initialRetryTime < 0) {
    throw new Error("Initial retry time must be a non-negative integer");
  }

  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(initialRetryTime * Math.pow(2, attempt));
    }
  }
}
