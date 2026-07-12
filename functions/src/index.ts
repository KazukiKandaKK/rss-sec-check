import { onSchedule, ScheduleOptions } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { fetchAllFeeds, fetchFeedItems } from "./lib/fetchFeeds.js";

initializeApp();

const db = getFirestore();

function getScheduleExpression(): string {
  const interval = Number(process.env.FETCH_SCHEDULE_INTERVAL || "30");
  if (Number.isNaN(interval) || interval <= 0) {
    return "every 30 minutes";
  }
  return `every ${interval} minutes`;
}

export const fetchRssOnSchedule = onSchedule(
  {
    schedule: getScheduleExpression(),
    timeZone: "UTC",
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 120,
    secrets: [],
  } as ScheduleOptions,
  async () => {
    await fetchAllFeeds(db);
  }
);

export { fetchFeedItems };
