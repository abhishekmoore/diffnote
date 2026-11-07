import { format } from "date-fns";

export function formatCreatedAt(date: Date): string {
  return format(date, "PPp");
}
