import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";

function isValidDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function toValidDate(date: Date): Date {
  if (isValidDate(date)) return date;
  return new Date();
}

export function formatRelativeTime(date: Date): string {
  try {
    return formatDistanceToNow(toValidDate(date), { addSuffix: true, locale: ja });
  } catch (error) {
    console.error("formatRelativeTime failed:", error);
    return "";
  }
}

export function formatAbsoluteTime(date: Date): string {
  try {
    return format(toValidDate(date), "yyyy/MM/dd HH:mm", { locale: ja });
  } catch (error) {
    console.error("formatAbsoluteTime failed:", error);
    return "";
  }
}
