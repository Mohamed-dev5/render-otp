import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./config/serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const expiresAt = admin.firestore.Timestamp.fromDate(
  new Date(Date.now() + 5 * 60 * 1000)
);
export const db = admin.firestore();
export const ad = admin.auth();
