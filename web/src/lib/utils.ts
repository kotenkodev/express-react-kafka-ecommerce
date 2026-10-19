export { cn } from "cn";

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};
