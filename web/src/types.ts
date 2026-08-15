import { Timestamp } from "firebase/firestore";

export interface Article {
  id: string;
  title: string;
  link: string;
  source: string;
  feedUrl: string;
  publishedAt: Timestamp;
  snippet: string;
  fetchedAt: Timestamp;
  read: boolean;
  starred: boolean;
  ownerEmail: string;
}

export interface Feed {
  id: string;
  url: string;
  name: string;
  category: string;
  enabled: boolean;
  ownerEmail: string;
}

export type ArticleFilter = "all" | "unread" | "starred";
