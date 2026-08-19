export type { Article } from "./entities/article";
export {
  createArticle,
  withReadStatus,
  withStarredStatus,
  markAsRead,
  markAsUnread,
  toggleRead as toggleArticleRead,
  toggleStar as toggleArticleStar,
  isUnread,
  isStarred,
} from "./entities/article";

export type { Feed, FeedDraft } from "./entities/feed";
export {
  createFeed,
  createFeedDraft,
  withEnabled,
  toggleEnabled as toggleFeedEnabled,
  isEnabled,
  isUnhealthy as isFeedUnhealthy,
} from "./entities/feed";

export { SearchQuery } from "./valueObjects/searchQuery";

export type ArticleFilter = "all" | "unread" | "starred" | "watched";
