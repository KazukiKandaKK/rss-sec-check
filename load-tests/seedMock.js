const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'rss-sec-check' });
const db = getFirestore();

async function main() {
  const ownerEmail = 'owner@example.com';

  await db.collection('config').doc('owner').set({ email: ownerEmail });
  console.log('Seeded config/owner');

  await db.collection('feeds').doc('mock_feed').set({
    url: 'http://127.0.0.1:9999/feed.xml',
    name: 'Mock Feed',
    category: 'Test',
    enabled: true,
    ownerEmail,
  });
  console.log('Seeded feeds/mock_feed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
