import { Article, isUnread, isStarred } from "../entities/article";
import { SearchQuery } from "../valueObjects/searchQuery";
import { ArticleFilter } from "../types";

export function filterArticles(
  articles: Article[],
  filter: ArticleFilter,
  source: string,
  searchQuery: SearchQuery
): Article[] {
  return articles.filter((article) => {
    if (filter === "unread" && !isUnread(article)) return false;
    if (filter === "starred" && !isStarred(article)) return false;
    if (source !== "all" && article.source !== source) return false;
    if (searchQuery.isEmpty) return true;
    return searchQuery.isIncludedIn(article.title, article.snippet);
  });
}
