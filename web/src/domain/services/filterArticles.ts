import { Article, isUnread, isStarred } from "../entities/article";
import { SearchQuery } from "../valueObjects/searchQuery";
import { ArticleFilter } from "../types";
import { matchWatchKeywords } from "./watchlist";

export function filterArticles(
  articles: Article[],
  filter: ArticleFilter,
  source: string,
  searchQuery: SearchQuery,
  watchKeywords: string[] = []
): Article[] {
  return articles.filter((article) => {
    if (filter === "unread" && !isUnread(article)) return false;
    if (filter === "starred" && !isStarred(article)) return false;
    if (
      filter === "watched" &&
      matchWatchKeywords(article.title, article.snippet, watchKeywords)
        .length === 0
    ) {
      return false;
    }
    if (source !== "all" && article.source !== source) return false;
    if (searchQuery.isEmpty) return true;
    return searchQuery.isIncludedIn(article.title, article.snippet);
  });
}
