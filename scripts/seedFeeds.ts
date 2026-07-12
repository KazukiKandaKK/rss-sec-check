import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

interface SeedFeed {
  url: string;
  name: string;
  category: string;
  enabled: boolean;
}

const defaultSeeds: SeedFeed[] = [
  {
    url: "https://feeds.feedburner.com/TheHackersNews",
    name: "The Hacker News",
    category: "News",
    enabled: true,
  },
  {
    url: "https://www.bleepingcomputer.com/feed/",
    name: "BleepingComputer",
    category: "News",
    enabled: true,
  },
  {
    url: "https://www.jpcert.or.jp/rss/jpcert.rdf",
    name: "JPCERT/CC",
    category: "Alert",
    enabled: true,
  },
  {
    url: "https://www.us-cert.gov/ncas/current-activity.xml",
    name: "CISA Current Activity",
    category: "Alert",
    enabled: true,
  },
  {
    url: "https://krebsonsecurity.com/feed/",
    name: "Krebs on Security",
    category: "Blog",
    enabled: true,
  },
];

async function main() {
  const envPath = resolve(process.cwd(), "..", ".env");
  try {
    const env = readFileSync(envPath, "utf-8");
    env.split("\n").forEach((line) => {
      const [key, ...value] = line.split("=");
      if (key && value.length && !process.env[key]) {
        process.env[key] = value.join("=").replace(/^["']|["']$/g, "");
      }
    });
  } catch {
    // .env file not required for emulator
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({
      credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    });
  } else {
    initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID || "rss-sec-check-placeholder" });
  }

  const db = getFirestore();

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });
  }

  const ownerEmail = process.env.OWNER_EMAIL || "owner@example.com";
  const ownerRef = db.collection("config").doc("owner");

  const batch = db.batch();
  batch.set(ownerRef, { email: ownerEmail }, { merge: true });
  console.log(`Seeding owner: ${ownerEmail}`);

  for (const seed of defaultSeeds) {
    const feedId = seed.url
      .replace(/^https?:\/\//, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    const ref = db.collection("feeds").doc(feedId);
    batch.set(ref, seed, { merge: true });
    console.log(`Seeding feed: ${seed.name} (${seed.url})`);
  }

  await batch.commit();
  console.log("Seeding complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
