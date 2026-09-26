import { onSchedule, ScheduleOptions } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  fetchAllFeeds,
  fetchFeedItems,
  pruneOldArticles,
} from "./lib/fetchFeeds.js";

initializeApp();

const db = getFirestore();

function getScheduleExpression(): string {
  const interval = Number(process.env.FETCH_SCHEDULE_INTERVAL || "30");
  if (Number.isNaN(interval) || interval <= 0) {
    return "every 30 minutes";
  }
  return `every ${interval} minutes`;
}

function getArticleMaxAgeDays(): number {
  const days = Number(process.env.ARTICLE_MAX_AGE_DAYS || "90");
  if (Number.isNaN(days)) {
    return 90;
  }
  return days;
}

export const fetchRssOnSchedule = onSchedule(
  {
    schedule: getScheduleExpression(),
    timeZone: "UTC",
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 120,
    maxInstances: 1,
    ingressSettings: "ALLOW_INTERNAL_ONLY",
    secrets: [],
  } as ScheduleOptions,
  async () => {
    await fetchAllFeeds(db);
    await pruneOldArticles(db, getArticleMaxAgeDays());
  }
);

export { fetchFeedItems };
