import { Article, ArticleFilter } from "../domain/types";

export function filterArticles(
  articles: Article[],
  filter: ArticleFilter,
  source: string,
  search: string
): Article[] {
  const term = search.trim().toLowerCase();
  return articles.filter((article) => {
    if (filter === "unread" && article.read) return false;
    if (filter === "starred" && !article.starred) return false;
    if (source !== "all" && article.source !== source) return false;
    if (!term) return true;
    return (
      article.title.toLowerCase().includes(term) ||
      article.snippet.toLowerCase().includes(term)
    );
  });
}
