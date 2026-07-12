import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";
// The compiled JS module is imported at runtime; transpileOnly handles this.
// @ts-ignore
import { fetchAllFeeds } from "../functions/lib/lib/fetchFeeds";

const CREDENTIALS_ERROR =
  "Firebase Admin credentials are not valid. For GitHub Actions, set FIREBASE_SERVICE_ACCOUNT to the JSON contents of the service account key (not the filename). For local runs, set GOOGLE_APPLICATION_CREDENTIALS to the path of the service account key file.";

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

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
      initializeApp({ credential: cert(serviceAccount) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      });
    } else {
      initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || "rss-sec-check-placeholder",
      });
    }
  } catch (error) {
    console.error(CREDENTIALS_ERROR);
    throw error;
  }

  const db = getFirestore();

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });
  }

  const results = await fetchAllFeeds(db);

  for (const result of results) {
    if (result.error) {
      console.error(`[${result.feed.name}] error: ${result.error}`);
    } else {
      console.log(
        `[${result.feed.name}] inserted=${result.inserted}, updated=${result.updated}`
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
