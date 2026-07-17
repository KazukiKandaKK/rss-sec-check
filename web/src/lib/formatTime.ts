import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ja });
}

export function formatAbsoluteTime(date: Date): string {
  return format(date, "yyyy/MM/dd HH:mm", { locale: ja });
}
