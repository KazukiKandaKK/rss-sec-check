import { ArticleFilter } from "../domain/types";

export function hasActiveFilter(
  filter: ArticleFilter,
  source: string,
  search: string
): boolean {
  return filter !== "all" || source !== "all" || search.trim().length > 0;
}
