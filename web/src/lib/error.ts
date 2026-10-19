import { AxiosError } from "axios";

export function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const serverMessage = err.response?.data?.error;

    if (!err.response) {
      return "Network error. Please check your internet connection.";
    }

    if (status === 404) {
      return "The requested item could not be found or has been removed.";
    }

    if (status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (status && status >= 500) {
      return "Server error occurred. Please try again later.";
    }

    if (serverMessage && typeof serverMessage === "string") {
      return serverMessage;
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
}
